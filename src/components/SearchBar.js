import * as React from 'react';

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
    const style = {
      width: '20rem',
      background: '#F2F1F9',
      border: 'none',
      padding: '0.5rem',
    };
    const visuallyhidden = {
      border: 0,
      clip: 'rect(0 0 0 0)',
      height: '1px',
      margin: '-1px',
      overflow: 'hidden',
      padding: 0,
      position: 'absolute',
      width: '1px',
    };
    return (
      <form onSubmit={this._handleSubmit}>
        <label style={visuallyhidden}>Start</label>
        <input
          style={style}
          type="text"
          autoFocus
          required
          placeholder="Start"
          onChange={this._setStart}
        />
        <label style={visuallyhidden}>End</label>
        <input
          style={style}
          type="text"
          required
          placeholder="End"
          onChange={this._setEnd}
        />
        <input type="submit" value="Submit" />
      </form>
    );
  }
}
