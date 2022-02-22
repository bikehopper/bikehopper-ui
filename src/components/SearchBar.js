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
  _handleStartKeyPress = (evt) => {
    if (evt.key === 'Enter' && this.state.end.length > 0)
      this._handleSubmit(evt);
  };
  _handleEndKeyPress = (evt) => {
    if (evt.key === 'Enter' && this.state.start.length > 0)
      this._handleSubmit(evt);
  };
  _handleSubmit = (event) => {
    event.preventDefault();
    this.props.onSubmit(this.state);
  };

  render() {
    return (
      <form className="SearchBar" onSubmit={this._handleSubmit}>
        <input
          aria-label="Starting location"
          className="SearchBar_input"
          type="text"
          autoFocus
          placeholder="from"
          onChange={this._setStart}
          onKeyPress={this._handleStartKeyPress}
        />
        <input
          aria-label="Ending location"
          className="SearchBar_input"
          type="text"
          placeholder="to"
          onChange={this._setEnd}
          onKeyPress={this._handleEndKeyPress}
        />
      </form>
    );
  }
}
