import * as React from 'react';

export default class SearchBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
    };
    this.placeholder = props.placeholder;
  }

  _handleChange = (event) => {
    this.setState({ value: event.target.value });
  }
  _handleSubmit = (event) => {
    event.preventDefault();
    this.props.onSubmit(this.state.value)
  }

  render() {
    const style = {
      width: "20rem", background: "#F2F1F9", border: "none", padding: "0.5rem"
    };
    return (
      <form onSubmit={this._handleSubmit}>
        <label>
          <input style={style} type='text' placeholder={this.placeholder} onChange={this._handleChange} />
        </label>
        <input type="submit" value="Submit" />
      </form>
    );
  }
}
