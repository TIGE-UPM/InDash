<template>
  <h2>Analyze course: {{ moodleCurrentCourse.shortname }}</h2>
  <v-container>
    <v-row>
      <v-col cols="4">
        <v-row
          ><v-col>
            <download-options
              :filtered-log="courseLogFiltered"
              :category-count-per-user="categoryCountPerUser"
              :event-count-per-user="eventCountPerUser"
            ></download-options
          ></v-col>
        </v-row>
        <v-row
          ><v-col>
            <course-log-filters
              :filter-options="courseLogFilterOptions"
              @filterSelectionUpdated="updateFilterSelection"
            />
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="8" v-if="!isLoading">
        <v-row>
          <v-col>
            <plot-user-selection
              :possible-users-data="possibleUsers"
              @userSelectionUpdated="updateUserSelection"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <user-selection-details
              :user-details="selectedUserData"
              :course-grades="courseGrades"
              :course-grades-range="courseGradeRangeFromatted"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <grade-distribution-box-plot
              v-if="
                Object.keys(categoryCountPerUser).length > 0 &&
                selectedUserData.length > 0
              "
              :data="courseGrades"
              :selected-users="selectedUserData"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <compare-event-distribution-radar-chart
              v-if="selectedUserData.length > 0"
              :plot-data="selectedUserData"
              :plot-data-categories="Object.values(eventCategories)"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <event-distribution-box-plot
              v-if="
                Object.keys(categoryCountPerUser).length > 0 &&
                selectedUserData.length > 0
              "
              :data="categoryCountPerUser"
              :selected-users="selectedUserData"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <course-log-table :course-log="courseLogFiltered.slice(0, 10)" />
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
// @ is an alias to /src
import CourseLogFilters from "@/components/CourseLogFilters.vue";
import CourseLogTable from "@/components/CourseLogTable.vue";
import CompareEventDistributionRadarChart from "@/components/CompareEventDistributionRadarChart.vue";
import PlotUserSelection from "@/components/PlotUserSelection.vue";
import EventDistributionBoxPlot from "@/components/EventDistributionBoxPlot.vue";
import GradeDistributionBoxPlot from "@/components/GradeDistributionBoxPlot.vue";
import UserSelectionDetails from "@/components/UserSelectionDetails.vue";
import DownloadOptions from "@/components/DownloadOptions.vue";

import { mapState } from "vuex";

import { debounce } from "lodash";

import { averageFakeUserId } from "@/utils/constants";

export default {
  name: "CourseLogAnalyzerView",
  components: {
    CourseLogFilters,
    CourseLogTable,
    CompareEventDistributionRadarChart,
    PlotUserSelection,
    EventDistributionBoxPlot,
    UserSelectionDetails,
    GradeDistributionBoxPlot,
    DownloadOptions,
  },
  data: function () {
    return {
      courseLogRaw: [],
      courseLogFilterActives: {},
      isLoading: true,
      selectedUsersToPlot: [],
      courseGrades: {},
      courseGradeRangeFromatted: "",
    };
  },
  computed: {
    ...mapState([
      "moodleUrl",
      "moodleToken",
      "moodleCurrentCourse",
      "eventMappings",
      "eventCategories",
    ]),

    courseLogFilterOptions() {
      // init filter object with empty arrays for each field
      const filterCategories = {};
      for (let key in this.courseLogRaw[0]) {
        filterCategories[key] = [];
      }
      const options = this.courseLogRaw.reduce((filters, row) => {
        for (let [key, val] of Object.entries(row)) {
          // add new filter option only if not yet present
          const index = filters[key].findIndex(
            (currentFilterOption) => currentFilterOption == val
          );
          if (index <= -1) {
            filters[key].push(val);
          }
        }

        return filters;
      }, filterCategories);
      // sort all options alphabetically or numerically in ascending order
      for (let key in this.courseLogRaw[0]) {
        if (typeof options[key][0] == "number") {
          options[key].sort((a, b) => a >= b);
        } else {
          options[key].sort();
        }
      }
      return options;
    },

    courseLogFiltered() {
      let courseLog = this.courseLogRaw.slice(); // create a copy of the raw course log
      for (const key in this.courseLogFilterActives) {
        courseLog = courseLog.filter((row) => {
          return (
            this.courseLogFilterActives[key].length == 0 || // prevent filtering by empty array of filter conditions
            this.courseLogFilterActives[key].includes(row[key])
          );
        });
      }
      return courseLog;
    },

    eventCountPerUser() {
      const ecpu = {};
      for (let i = 0; i < this.courseLogFiltered.length; i++) {
        ecpu[this.courseLogFiltered[i].userid] =
          ecpu[this.courseLogFiltered[i].userid] || {};
        ecpu[this.courseLogFiltered[i].userid][
          this.courseLogFiltered[i].eventname
        ] =
          (ecpu[this.courseLogFiltered[i].userid][
            this.courseLogFiltered[i].eventname
          ] || 0) + 1;
      }
      return ecpu;
    },

    categoryCountPerUser() {
      const ccPerUser = {};
      for (const key in this.eventCountPerUser) {
        const userInitialized = {};
        for (let j = 0; j < this.eventCategories.length; j++) {
          userInitialized[this.eventCategories[j]] = 0;
        }
        ccPerUser[key] = userInitialized;
      }
      for (const userKey in this.eventCountPerUser) {
        for (const [eventnameKey, count] of Object.entries(
          this.eventCountPerUser[userKey]
        )) {
          // get event category for current event
          const eventCategory = this.eventMappings[eventnameKey].newlc;
          // add to catgeory count for current user (except for undefined values)
          if (eventCategory) {
            ccPerUser[userKey][eventCategory] += count;
          }
        }
      }
      return ccPerUser;
    },

    categoryCountAverage() {
      const len = Object.keys(this.categoryCountPerUser).length;
      // init sum object for each category
      const sum = {};
      for (const category of this.eventCategories) {
        sum[category] = 0;
      }
      // sum for each category
      for (const user of Object.values(this.categoryCountPerUser)) {
        for (const category of this.eventCategories) {
          sum[category] = sum[category] + user[category];
        }
      }
      // compute average for each category
      for (const category of this.eventCategories) {
        sum[category] = sum[category] / len;
      }
      return sum;
    },

    possibleUsers() {
      // inject the fake user id
      return [averageFakeUserId].concat(this.courseLogFilterOptions["userid"]);
    },

    selectedUserData() {
      const userData = [];
      this.selectedUsersToPlot.forEach((userid) => {
        {
          if (userid == averageFakeUserId) {
            // use the average over all users
            let total = 0;
            for (const grade of Object.values(this.courseGrades)) {
              total += grade.grade;
            }
            const averageGrade = total / Object.keys(this.courseGrades).length;

            return userData.push({
              data: Object.values(this.categoryCountAverage),
              name: "Average",
              role: "norole",
              grade: { grade: averageGrade },
            });
          } else {
            // get data for user if present, else create object without zero initialized values
            let data = {};
            if (
              Object.keys(this.categoryCountPerUser).includes(userid.toString())
            ) {
              data = Object.values(
                this.categoryCountPerUser[userid.toString()]
              );
            } else {
              this.eventCategories.forEach((category) => {
                data[category] = 0;
              });
            }
            return userData.push({
              data,
              name: "Student " + userid,
              role: this.courseLogRaw.find((row) => row.userid == userid)
                .userrole,
              grade: this.courseGrades[userid.toString()],
            });
          }
        }
      });
      return userData;
    },
  },
  methods: {
    fetchCourseLog() {
      const wsFunction = "local_moodle_ws_la_trace_exporter_get_course_data";
      const moodleDataExportEndpoint = `${this.moodleUrl}/webservice/rest/server.php?wstoken=${this.moodleToken}&wsfunction=${wsFunction}&moodlewsrestformat=json&courseids[0]=${this.moodleCurrentCourse.courseid}`;
      fetch(moodleDataExportEndpoint)
        .then((response) => response.json())
        .then((data) => {
          this.courseLogRaw = data;
          this.isLoading = false;
        });
    },
    fetchCourseGrade() {
      const wsFunction = "gradereport_user_get_grade_items";
      const moodleDataExportEndpoint = `${this.moodleUrl}/webservice/rest/server.php?wstoken=${this.moodleToken}&wsfunction=${wsFunction}&moodlewsrestformat=json&courseid=${this.moodleCurrentCourse.courseid}`;
      fetch(moodleDataExportEndpoint)
        .then((response) => response.json())
        .then((data) => {
          for (const ug of data.usergrades) {
            const courseGradeItem = ug.gradeitems.find(
              (gi) => gi.itemtype == "course"
            );
            this.courseGrades[ug.userid] = {
              date: courseGradeItem.gradedategraded,
              grade: courseGradeItem.graderaw,
            };
          }

          // store also grade min/grade max
          const exampleGrade = data.usergrades[0].gradeitems.find(
            (gi) => gi.itemtype == "course"
          );
          this.courseGradeRangeFromatted = exampleGrade
            ? exampleGrade.rangeformatted
            : "undefined";
        });
    },

    // Use a debounced function to give Vue time to update computed variables based on active filters (reactivity delay)
    updateFilterSelection: debounce(function (newSelection) {
      this.courseLogFilterActives = newSelection;
    }, 100),

    updateUserSelection(newSelection) {
      this.selectedUsersToPlot = newSelection;
    },
  },
  mounted() {
    this.fetchCourseGrade();
    this.fetchCourseLog();
  },
};
</script>
