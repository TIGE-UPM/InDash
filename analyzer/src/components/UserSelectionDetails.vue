<template>
  <v-card>
    <v-card-header>Selected Users Course Meta Information</v-card-header>
    <v-container>
      <v-row>
        <v-col style="text-align: left">
          Course Grades Range: <span v-html="courseGradesRange"></span>
        </v-col>
      </v-row>
      <v-row>
        <v-col
          v-for="user in userDetails"
          :key="user.name"
          style="text-align: left"
        >
          <b>{{ user.name }}</b>
          <br />
          Role: {{ user.role }}
          <br />
          Grade received on:
          <span v-if="user.grade && user.grade.date">
            {{ formatTimestampToDate(user.grade.date) }}
          </span>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script>
import { averageFakeUserId } from "@/utils/constants";
import { formatTimestampToDate, formatGrade } from "@/utils/helpers";

export default {
  name: "UserSelectionDetails",
  props: ["userDetails", "courseGrades", "courseGradesRange"],
  computed: {
    onlyUsers() {
      return this.userDetails.filter((u) => u.name != averageFakeUserId);
    },
  },
  methods: {
    formatTimestampToDate,
    formatGrade,
  },
};
</script>
