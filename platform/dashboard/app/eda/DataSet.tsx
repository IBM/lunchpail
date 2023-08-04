import { Component } from "react";
import { Box, Grid } from "@mui/material";

export class DataSet extends Component {
  public override render() {
    return (
      <>
        <Grid container style={{ marginTop: "2%" }} spacing={0.5}>
          {Array.from(Array(30)).map((_, index) => (
            <Grid item xs="auto" key={index}>
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  bgcolor: "pink",
                  "&:hover": {
                    backgroundColor: "primary.dark",
                    opacity: [0.9, 0.8, 0.7],
                  },
                }}
              >
                D{(index += 1)}
              </Box>
            </Grid>
          ))}
        </Grid>
        <text style={{ marginLeft: "40%" }}>DataSet</text>
      </>
    );
  }
}
