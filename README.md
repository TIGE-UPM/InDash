# Moodle Interactions Plugin Project

Aim of this project is the creation of a learning analytics web application for data extracted from the Moodle standard log.

Hereafter the different project folders are quickly described:

- `analyzer/`: the web application with instructions for setup und usage.
- `docs/`: relevant papers and _log event - event category_ mapping file(s).
- `sql_queries/`: an SQL script to extract data directly from the Moodle database with explanations of the queries used.
- `Interactions 2.0 Updated (old plugin)/`: the old Moodle Interactions Plugin which has been developped for Moodle 2.0.

## Moodle Docker Environment

The here contained `docker-compose.yml` configuration file allows to setup a containerized Moodle instance. If `docker` and `docker-compose` have been installed, simply run the following command and access the Moodle instance on http://localhost:8000:

```
docker-compose up
```
