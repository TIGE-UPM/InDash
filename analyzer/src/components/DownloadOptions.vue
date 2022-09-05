<template>
  <v-card style="overflow: visible">
    <v-card-header> Download </v-card-header>
    <v-container>
      <v-row>
        <v-col>
          <v-btn block color="primary" :disabled="false" @click="download()"
            >Filtered Data Set</v-btn
          >
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script>
const XLSX = require("xlsx");

import { mapState } from "vuex";

export default {
  name: "DownloadOptions",
  props: ["filteredLog", "categoryCountPerUser", "eventCountPerUser"],
  computed: {
    ...mapState(["eventMappings"]),
  },
  methods: {
    download() {
      // Create a new workbook
      const workbook = XLSX.utils.book_new();

      // Prepare data
      const augmentedFilteredLog = this.filteredLog.map((entry) => {
        return {
          lcic: this.eventMappings[entry.eventname].newlc,
          ...entry,
        };
      });

      // Add all sheets to the workbook
      this.addSheet(workbook, augmentedFilteredLog, "Filtered Data Set");
      this.addSheet(
        workbook,
        this.convertObjectOfObjectsToArray(this.categoryCountPerUser),
        "Category Count Per User"
      );
      this.addSheet(
        workbook,
        this.convertObjectOfObjectsToArray(this.eventCountPerUser),
        "Event Count Per User"
      );

      // export your excel
      XLSX.writeFile(workbook, "Binaire.xlsx");
    },

    // convert an object of objects to array and add the key as a field
    convertObjectOfObjectsToArray(objOfObj) {
      const arrayOfObj = [];
      for (let key in objOfObj) {
        const obj = {
          Userid: key,
          ...objOfObj[key],
        };
        arrayOfObj.push(obj);
      }
      return arrayOfObj;
    },

    // create a sheet based on the given dataset and add it to the workbook
    addSheet(workbook, dataset, sheetName) {
      // Create the worksheet
      let sheet = XLSX.utils.json_to_sheet(dataset);

      // Add the sheet to the workbook
      XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
    },
  },
};
</script>
