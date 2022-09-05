<template>
  <v-card>
    <v-card-header>Selected Users Event Distribution</v-card-header>
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

import { firstUserPlotColor, secondUserPlotColor } from "@/utils/constants";

export default {
  name: "CompareEventDistributionRadarChart",
  props: ["plotData", "plotDataCategories"],
  components: {
    VueHighcharts,
  },
  computed: {
    chartOptions() {
      const series = [];
      this.plotData.forEach((element, index) => {
        series.push({
          name: element.name,
          data: element.data,
          pointPlacement: "on",
          color: index == 0 ? firstUserPlotColor : secondUserPlotColor,
        });
      });

      return {
        chart: {
          polar: true,
          type: "line",
        },

        title: {
          text: "",
          hide: true,
        },

        pane: {
          size: "80%",
        },

        xAxis: {
          categories: this.plotDataCategories,
          tickmarkPlacement: "on",
          lineWidth: 0,
        },

        yAxis: {
          gridLineInterpolation: "polygon",
          lineWidth: 0,
          min: 0,
        },

        tooltip: {
          shared: true,
          pointFormat: "<span>{series.name}: <b>{point.y:,.0f}</b><br/>",
        },

        legend: {
          align: "right",
          verticalAlign: "middle",
          layout: "vertical",
        },

        series: series,

        responsive: {
          rules: [
            {
              condition: {
                maxWidth: 500,
              },
              chartOptions: {
                legend: {
                  align: "center",
                  verticalAlign: "bottom",
                  layout: "horizontal",
                },
                pane: {
                  size: "70%",
                },
              },
            },
          ],
        },
      };
    },
  },
};
</script>
