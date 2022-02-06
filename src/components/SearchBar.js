import * as React from 'react';

export default class SearchBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
  }
  handleSubmit(event) {
    event.preventDefault();
    this.props.onSubmit(this.state.value)
  }
  render() {
    const style = {
      width: "20rem", background: "#F2F1F9", border: "none", padding: "0.5rem"
    };
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          <input style={style} type='text' placeholder='enter longitude, latitude' onChange={this.handleChange} onClick="event.stopPropagation()" />
        </label>
        <input type="submit" value="Submit" onClick="event.stopPropagation()" />
      </form>
    );
  }
}
