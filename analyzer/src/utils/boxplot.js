import { floatToFixed } from "@/utils/helpers.js";
import { blackPlotColor } from "@/utils/constants";

// generates an object to plot data from a user in a boxplot
export const generateSelectedUserPlotConfigData = (user, color) => {
  const pointCoordinates = Object.entries(user.data).map((point) => [
    parseInt(point[0]), // select x-axis
    point[1], // value on y-axis
  ]);
  return {
    name: user.name,
    color: color,
    type: "scatter",
    data: pointCoordinates,
    marker: {
      fillColor: color,
      lineWidth: 1,
      lineColor: color,
    },
    tooltip: {
      pointFormat: "Values {point.y}",
    },
  };
};

// generates an object to plot data of the quartiles and median in a boxplot
export const generateQuartileAndMedianPlotConfigData = (boxData) => {
  return {
    name: "Quartiles and Median",
    color: blackPlotColor,
    data: boxData,
    tooltip: {
      headerFormat: "<em>Category {point.key}</em><br/>",
    },
  };
};

// generates an object to plot data of outliers in a boxplot
export const generateOutlierPlotConfigData = (boxData) => {
  return {
    name: "Outliers",
    color: blackPlotColor,
    type: "scatter",
    data: [
      // x, y positions where x=0 is the first category
      ...Array.prototype.concat(
        // unpack  to meet expected format from highcharts
        ...boxData
          .filter((d) => d.outliers.length > 0) // ignore empty arrays
          .map((d) => d.outliers)
      ),
    ],
    marker: {
      fillColor: "white",
      lineWidth: 1,
      lineColor: blackPlotColor,
    },
    tooltip: {
      pointFormat: "Value: {point.y}",
    },
  };
};

// because .sort() doesn't sort numbers correctly
const numSort = (a, b) => {
  return a - b;
};

// get any percentile from an array
const getPercentile = (data, percentile) => {
  data.sort(numSort);
  var index = (percentile / 100) * data.length;
  var result;
  if (Math.floor(index) == index) {
    result = (data[index - 1] + data[index]) / 2;
  } else {
    result = data[Math.floor(index)];
  }
  return result;
};

// identify the outliers outside of the interval [lowerFence, upperFence] in the current dataset
export const getOutliers = (data, lowerFence, upperFence) => {
  const outliers = [];
  for (var i = 0; i < data.length; i++) {
    if (data[i] < lowerFence || data[i] > upperFence) {
      outliers.push(data[i]);
    }
  }
  return outliers;
};

// generate meta data for boxplot
export const getBoxValues = (data) => {
  var boxData = {},
    min = Math.min.apply(Math, data),
    max = Math.max.apply(Math, data),
    q1 = getPercentile(data, 25),
    median = getPercentile(data, 50),
    q3 = getPercentile(data, 75),
    iqr = q3 - q1,
    lowerFence = q1 - iqr * 1.5,
    upperFence = q3 + iqr * 1.5;

  boxData.values = {};
  boxData.values.low = min < lowerFence ? lowerFence : min;
  boxData.values.q1 = q1;
  boxData.values.median = median;
  boxData.values.q3 = q3;
  boxData.values.high = max > upperFence ? upperFence : max;

  // round number to default number of decimals
  for (let key in boxData.values) {
    if (typeof boxData.values[key] == "number") {
      boxData.values[key] = floatToFixed(boxData.values[key]);
    }
  }

  return boxData;
};
