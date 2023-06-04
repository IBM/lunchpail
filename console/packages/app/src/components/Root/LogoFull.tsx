import React from 'react';
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles({
  svg: {
    width: 'auto',
    height: 30,
  },
  div: {
    color: '#7df3e1',
    fontSize: 30
  },
  path: {
    fill: '#7df3e1',
  },
});
const LogoFull = () => {
  const classes = useStyles();

  return (
    <div className={classes.div}>CodeFlare</div>
  )
};

export default LogoFull;
