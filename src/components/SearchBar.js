import * as React from 'react';

export default class SearchBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      start: undefined,
      end: undefined,
    };
    this.placeholder = props.placeholder;
  }

  _setStart = (event) => {
    this.setState({ start: event.target.value });
  }
  _setEnd = (event) => {
    this.setState({ end: event.target.value });
  }
  _handleSubmit = (event) => {
    event.preventDefault();
    this.props.onSubmit(this.state)
  }

  render() {
    const style = {
      width: "20rem", background: "#F2F1F9", border: "none", padding: "0.5rem"
    };
    return (
      <form onSubmit={this._handleSubmit}>
        <label for='start'>Start</label>
        <input style={style} id='start' type='text' autofocus required placeholder='from' onChange={this._setStart} />
        <label for='end'>End</label>
        <input style={style} id='end' type='text' required placeholder='to' onChange={this._setEnd} />
        <input type="submit" value="Submit" />
      </form>
    );
  }
}
