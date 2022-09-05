<template>
  <v-card>
    <v-card-header>Grade Distribution</v-card-header>
    <vue-highcharts
      type="chart"
      :options="chartOptions"
      :redrawOnUpdate="true"
      :oneToOneUpdate="true"
      :animateOnUpdate="true"
    />
  </v-card>
</template>

<script>
import VueHighcharts from "vue3-highcharts";
import HighCharts from "highcharts";
import HighchartsMore from "highcharts/highcharts-more";

HighchartsMore(HighCharts);

import * as bp from "@/utils/boxplot";
import { firstUserPlotColor, secondUserPlotColor } from "@/utils/constants";
import { cloneDeep } from "lodash";

export default {
  name: "GradeDistributionBoxPlot",
  props: ["data", "selectedUsers"],
  components: {
    VueHighcharts,
  },
  computed: {
    // transform the selected user objects to match the expectation to display the grade
    selectedUsersAdapter() {
      const adaptedSelectedUsers = cloneDeep(this.selectedUsers);
      for (const user of adaptedSelectedUsers) {
        user.data = user.grade ? [user.grade.grade] : [undefined];
      }
      return adaptedSelectedUsers;
    },
    // inspired by: https://stackoverflow.com/a/30896483/6691953
    chartOptions() {
      // remove the date object from nested grade objects
      const gradeData = cloneDeep(this.data);
      for (let key in gradeData) {
        delete gradeData[key].date;
      }

      // check if we need to inject average

      // build the data and add the series to the chart
      const boxData = [];

      // get labels from input data (i.e. categories)
      const labels = Object.keys(gradeData[Object.keys(gradeData)[0]]);
      // transform input data to arrays containing values of each category
      const transformedData = labels.map((l) => {
        return Object.values(gradeData).map((user) => {
          return user[l];
        });
      });
      // calculate box plot values
      for (let i = 0; i < transformedData.length; i++) {
        const boxValues = bp.getBoxValues(transformedData[i]);
        boxValues.values.x = i;
        const boxOutliers = bp.getOutliers(
          transformedData[i],
          boxValues.values.low,
          boxValues.values.high
        );
        boxValues.values.outliers = boxOutliers.map((x) => [i, x]); // TODO: place this properly, meaning if on values or somewhere else
        boxData.push(boxValues.values);
      }
      return {
        chart: {
          type: "boxplot",
          inverted: true,
          height: 150,
        },

        title: {
          text: "", // hack to not display any title
        },

        legend: {
          verticalAlign: "top",
          layout: "horizontal",
        },

        xAxis: {
          categories: labels,
          visible: false,
        },

        yAxis: {
          title: {
            text: "Grade",
          },
        },

        series: [
          // config data for quartile and median
          bp.generateQuartileAndMedianPlotConfigData(boxData),
          // config data for outliers
          bp.generateOutlierPlotConfigData(boxData),
          // config data for first selected user
          bp.generateSelectedUserPlotConfigData(
            this.selectedUsersAdapter[0],
            firstUserPlotColor
          ),
          // config data for second selected user
          bp.generateSelectedUserPlotConfigData(
            this.selectedUsersAdapter[1],
            secondUserPlotColor
          ),
        ],
      };
    },
  },
};
</script>
