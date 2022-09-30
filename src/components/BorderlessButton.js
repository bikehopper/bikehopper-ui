import * as React from 'react';

// A button with the styles reset, for when you have something that
// functions as a button (and want to use the <button> tag for
// accessibility) but want it to look like just inline text.

import './BorderlessButton.css';

export default function BorderlessButton(props) {
  return <button className="BorderlessButton" {...props} />;
}
