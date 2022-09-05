<template>
  <h2>Select a file to map events to analytics categories</h2>
  <v-container>
    <v-file-input
      accept=".xlsx,.xls"
      label="Mapping File"
      @change="_change"
    ></v-file-input>

    <v-btn
      v-if="data.length > 0"
      block
      color="primary"
      @click="$router.push({ name: 'analyzer' })"
      class="py-7"
      id="nextButton"
      >Continue analyzing the log</v-btn
    >
    <v-card v-if="data.length > 0" class="mt-8">
      <v-card-title>File content preview</v-card-title>
      <v-table>
        <template v-slot:default>
          <thead>
            <tr>
              <th
                v-for="columnHeader in headers"
                :key="'header-' + columnHeader"
              >
                {{ columnHeader }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in data" :key="'row-' + index">
              <td v-for="(c, i) in headers" :key="'row-' + index + 'col-' + i">
                {{ row[c] }}
              </td>
            </tr>
          </tbody>
        </template>
      </v-table>
    </v-card>
  </v-container>
</template>

<style scoped>
td {
  text-align: left;
}
</style>

<script>
import * as XLSX from "xlsx";
const _SheetJSFT = ["xlsx", "xls"]
  .map(function (x) {
    return "." + x;
  })
  .join(",");

export default {
  name: "SelectEventMappingFileFormView",
  data: function () {
    return {
      data: [],
      headers: [],
      SheetJSFT: _SheetJSFT,
    };
  },
  methods: {
    _change(evt) {
      const files = evt.target.files;
      if (files && files[0]) this._file(files[0]);
    },
    _file(file) {
      /* Boilerplate to set up FileReader */
      const reader = new FileReader();
      reader.onload = (e) => {
        /* Parse data */
        const ab = e.target.result;
        const wb = XLSX.read(new Uint8Array(ab), { type: "array" });
        /* Get first worksheet */
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        /* Convert array of arrays */
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, range: 7 });
        /* Extract all table headers */
        const headersAll = data.shift();
        /* Convert data arrays into array of objects with header column name as keys */
        const dataFormatted = [];
        const columnsOfInterest = [
          "eventname",
          "activepassive",
          "useragentbased",
          "newlc",
        ];
        data.forEach((row) => {
          const rowObj = {};
          headersAll.forEach((key, index) => {
            // only consider columns of interest
            if (columnsOfInterest.includes(key)) {
              // strip number tags if requried (and check if current cell has some content)
              if (
                ["useragentbased", "newlc"].includes(key) &&
                typeof row[index] !== "undefined"
              ) {
                rowObj[key] = row[index].substring(2); // remove the two first characters
              } else if (
                ["activepassive"].includes(key) &&
                typeof row[index] !== "undefined"
              ) {
                rowObj[key] = row[index].substring(3); // remove the three first characters
              } else {
                rowObj[key] = row[index];
              }
            }
          });
          dataFormatted.push(rowObj);
        });
        /* Update state */
        this.data = dataFormatted;
        this.headers = columnsOfInterest;
        /* Update store */
        this.$store.commit("setEventMappings", this.data);
      };
      reader.readAsArrayBuffer(file);
    },
  },
};
</script>
