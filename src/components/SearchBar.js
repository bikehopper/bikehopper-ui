import * as React from 'react';
import { useDispatch } from 'react-redux';
import Icon from './Icon';
import { locationTyped } from '../features/geocoding';

import { ReactComponent as Pin } from 'iconoir/icons/pin-alt.svg';

import './SearchBar.css';

export default function SearchBar(props) {
  const dispatch = useDispatch();
  const [start, setStart] = React.useState('');
  const [end, setEnd] = React.useState('');

  const handleStartChange = (evt) => {
    const text = evt.target.value;
    setStart(text);
    dispatch(locationTyped(text));
  };

  const handleEndChange = (evt) => {
    const text = evt.target.value;
    setEnd(text);
    dispatch(locationTyped(text));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    props.onSubmit({ start, end });
    event.target.blur();
  };

  const handleStartKeyPress = (evt) => {
    if (evt.key === 'Enter' && end.length > 0) handleSubmit(evt);
  };

  const handleEndKeyPress = (evt) => {
    if (evt.key === 'Enter' && start.length > 0) handleSubmit(evt);
  };

  return (
    <form className="SearchBar" onSubmit={handleSubmit}>
      <span className="SearchBar_inputContainer">
        <Icon className="SearchBar_icon">
          <Pin />
        </Icon>
        <input
          aria-label="Starting location"
          className="SearchBar_input"
          type="text"
          placeholder="from"
          onChange={handleStartChange}
          onKeyPress={handleStartKeyPress}
        />
      </span>
      <span className="SearchBar_inputContainer">
        <Icon className="SearchBar_icon">
          <Pin />
        </Icon>
        <input
          aria-label="Ending location"
          className="SearchBar_input"
          type="text"
          placeholder="to"
          onChange={handleEndChange}
          onKeyPress={handleEndKeyPress}
        />
      </span>
    </form>
  );
}
