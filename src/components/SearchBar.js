import * as React from 'react';

import './SearchBar.css';

export default class SearchBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      start: '',
      end: '',
    };
  }

  _setStart = (event) => {
    this.setState({ start: event.target.value });
  };
  _setEnd = (event) => {
    this.setState({ end: event.target.value });
  };
  _handleSubmit = (event) => {
    event.preventDefault();
    this.props.onSubmit(this.state);
  };

  render() {
    return (
      <form onSubmit={this._handleSubmit}>
        <label>Start</label>
        <input
          className="SearchBar_input"
          type="text"
          autoFocus
          placeholder="from"
          onChange={this._setStart}
        />
        <label>End</label>
        <input
          className="SearchBar_input"
          type="text"
          placeholder="to"
          onChange={this._setEnd}
        />
        <input type="submit" value="Submit" />
      </form>
    );
  }
}
