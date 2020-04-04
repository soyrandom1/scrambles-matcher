import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Paper from '@material-ui/core/Paper';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Typography from '@material-ui/core/Typography';
import XLSX from 'xlsx';
import {
  personWcifFromRegistrationXlsx,
  roundWcifFromXlsx,
} from '../../logic/xlsx-utils';
import { CompetitionsSection } from './CompetitionsList';

//import tmpWcif from '../../wcifresults.json';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(4),
  },
  input: {
    display: 'none',
  },
  tabContent: {
    padding: theme.spacing(2),
  },
}));

const loadSheetIntoWcif = (wcif, name, jsonSheet) => {
  // This function strongly assumes that 'Registration' is the first sheet...
  if (name === 'Registration') {
    wcif.name = jsonSheet[0][0];
    wcif.shortName = wcif.name;
    wcif.persons = personWcifFromRegistrationXlsx(jsonSheet);
  } else {
    // Cubecomps export numbers for round identification, CubingChina exports
    // the roundTypeId.
    let eventId = name.split('-')[0];
    let event = wcif.events.find(e => e.id === eventId);
    if (!event) {
      event = {
        id: eventId,
        rounds: [],
        competitorLimit: null,
        qualification: null,
      };
      wcif.events.push(event);
    }
    let roundNumber = event.rounds.length + 1;
    event.rounds.push(
      roundWcifFromXlsx(wcif.persons, eventId, roundNumber, jsonSheet)
    );
  }
};

const xlsxOptions = {
  header: 1,
  raw: false,
  blankrows: false,
};

const handleXlsxUploadChange = (updater, event) => {
  const reader = new FileReader();
  const rABS = !!reader.readAsBinaryString;

  reader.onload = e => {
    const wb = XLSX.read(e.target.result, { type: rABS ? 'binary' : 'array' });
    const sheetNames = wb.SheetNames;
    const wcif = {
      // Unfortunately this is not included in the XLSX :(
      id: null,
      name: '<undefined>',
      shortName: '<undefined>',
      schedule: [],
      events: [],
      persons: [],
    };
    sheetNames.forEach(name =>
      loadSheetIntoWcif(
        wcif,
        name,
        XLSX.utils.sheet_to_json(wb.Sheets[name], xlsxOptions)
      )
    );
    updater(wcif);
  };

  reader.onerror = e => alert("Couldn't load the JSON file");

  if (rABS) reader.readAsBinaryString(event.target.files[0]);
  else reader.readAsArrayBuffer(event.target.files[0]);
};

const handleFileUploadChange = (updater, event) => {
  let reader = new FileReader();

  reader.onload = e => updater(JSON.parse(e.target.result));

  reader.onerror = e => alert("Couldn't load the JSON file");

  reader.readAsText(event.target.files[0]);
};

const Loading = () => <CircularProgress color="secondary" />;

const ImportWCIF = ({
  handleWcifJSONLoad,
  importFromCompetition,
  competitions,
  loading,
  signedIn,
}) => {
  const classes = useStyles();
  const [tabValue, setTabValue] = useState('wca');

  // Dirty hack to preload given WCIF
  //handleWcifJSONLoad(tmpWcif);
  return (
    <Grid container justify="center">
      <Grid item xs={12} md={8} lg={7} xl={6} className={classes.root}>
        <Grid container direction="column" spacing={3}>
          <Grid item>
            <Typography variant="h2" component="h1" align="center">
              Scrambles Matcher
            </Typography>
          </Grid>
          <Grid item>
            <Typography>
              {`This tool enables you to assign sets of JSON scrambles generated by
              TNoodle to a WCIF.`}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="h5" gutterBottom>
              Get started
            </Typography>
            <Paper elevation={1}>
              <Tabs
                variant="fullWidth"
                value={tabValue}
                onChange={(event, value) => setTabValue(value)}
              >
                <Tab label="WCA import" value="wca" />
                <Tab label="WCIF file" value="wcif" />
                <Tab label="XLSX file" value="xlsx" />
              </Tabs>
              <div className={classes.tabContent}>
                {tabValue === 'wca' && (
                  <Grid container direction="column" spacing={2}>
                    <Grid item>
                      <Typography>
                        {`Start by importing any competition you manage from the WCA website.`}
                      </Typography>
                    </Grid>
                    <Grid item align="center">
                      {loading ? (
                        <Loading />
                      ) : (
                        <CompetitionsSection
                          competitions={competitions}
                          importFromCompetition={importFromCompetition}
                        />
                      )}
                    </Grid>
                    <Grid item>
                      <Typography variant="caption">
                        {`This option will only work if you used a scoretaking platform that
                          saves the results in the WCIF on the WCA website (e.g. WCA Live).`}
                      </Typography>
                    </Grid>
                  </Grid>
                )}
                {tabValue === 'wcif' && (
                  <Grid container direction="column" spacing={2}>
                    <Grid item>
                      <Typography>
                        {`Start by importing a JSON file with an existing WCIF.`}
                      </Typography>
                    </Grid>
                    <Grid item align="center">
                      <input
                        accept=".json"
                        className={classes.input}
                        id="button-wcif"
                        multiple
                        type="file"
                        onChange={ev =>
                          handleFileUploadChange(handleWcifJSONLoad, ev)
                        }
                      />
                      <label htmlFor="button-wcif">
                        <Button
                          component="span"
                          variant="outlined"
                          color="primary"
                          className={classes.button}
                        >
                          Upload WCIF
                        </Button>
                      </label>
                    </Grid>
                  </Grid>
                )}
                {tabValue === 'xlsx' && (
                  <Grid container direction="column" spacing={2}>
                    <Grid item>
                      <Typography>
                        {`Start by importing a results spreadsheet (e.g. created by Cubecomps or
                          Cubing China).`}
                      </Typography>
                    </Grid>
                    <Grid item align="center">
                      <input
                        accept=".xlsx"
                        className={classes.input}
                        id="button-xlsx"
                        multiple
                        type="file"
                        onChange={ev =>
                          handleXlsxUploadChange(handleWcifJSONLoad, ev)
                        }
                      />
                      <label htmlFor="button-xlsx">
                        <Button
                          component="span"
                          variant="outlined"
                          color="primary"
                          className={classes.button}
                        >
                          Upload XLSX
                        </Button>
                      </label>
                    </Grid>
                  </Grid>
                )}
              </div>
            </Paper>
          </Grid>
          <Grid item>
            <Typography variant="caption">
              <Typography
                variant="caption"
                component="span"
                color="error"
                style={{ fontWeight: 'bold' }}
              >
                Note:
              </Typography>
              {` there is currently no check whatsoever on the imported data. If
                you upload incomplete results, or the wrong file on the wrong
                place, the application will simply crash. If you refresh the page,
                you will have to start over.`}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="h5" gutterBottom>
              Description
            </Typography>
            <Typography paragraph>
              {`You are most likely used to using the Workbook Assistant (WA).
                For competition where everything went well and you just have
                a single, comprehensive JSON scrambles file, using this should be
                almost like using the WA.`}
            </Typography>
            <Typography paragraph>
              {`If you have had to edit manually some scrambles JSON because of
                Multiple Blindfolded, or if you have had to combine multiple
                scrambles JSONs, read on! Here is a non exhaustive list of
                differences:`}
            </Typography>
            <Typography variant="h6">Additions</Typography>
            <List disablePadding>
              <ListItem disableGutters>
                <ListItemText
                  primary={`"Better" scrambles matching`}
                  secondary={`
                    The WA re-assigns automatically scrambles each time you upload a
                    separate scrambles JSON. Even if you already matched a round to
                    its corresponding set in the already uploaded scrambles.
                    Scrambles Matcher assigns on-demand, and will only try to
                    associate rounds without scrambles to newly imported scrambles.
                  `}
                />
              </ListItem>
              <ListItem disableGutters>
                <ListItemText
                  primary={`Better drag and drop for scrambles`}
                  secondary={`
                    If you have moved scrambles around in the WA you know
                    what I'm talking about.
                  `}
                />
              </ListItem>
              <ListItem disableGutters>
                <ListItemText
                  primary={`Native support for attempt-based event`}
                  secondary={
                    <span>
                      {`Namely Multiple Blindfolded and Fewest Moves. When
                        importing scrambles JSON(s) it will split scramble sheets
                        for these events into attempt, so that they can be matched
                        (manually or automatically) to the attempt they have
                        actually been used for.`}
                      <br />
                      {`Especially useful if you had to generate a couple of extra
                        scrambles for Multiple Blindfolded, or simply if you used
                        several groups for that event.`}
                      <br />
                      {`Then for the results JSON they are grouped together in a
                        meaningful way for the WCA website.`}
                    </span>
                  }
                />
              </ListItem>
              <ListItem disableGutters>
                <ListItemText
                  primary={`Lightweight`}
                  secondary={`
                    No more 100MB database download, no more Java, just an web page
                    to load. However this leads to a missing feature (for now), see below.
                  `}
                />
              </ListItem>
            </List>
            <Typography variant="h6">Missing feature</Typography>
            <List disablePadding>
              <ListItem disableGutters>
                <ListItemText
                  primary={`No more newcomers check`}
                  secondary={`
                    It does mean you will have to upload
                    the results to the WCA website first, as it will validate the
                    list of competitors. Since you can download the Results JSON
                    even if you don't have assigned scrambles, you should be able to
                    check newcomers even before going through scrambles assignment.
                  `}
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ImportWCIF;
