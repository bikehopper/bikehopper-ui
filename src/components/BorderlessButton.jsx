import classnames from 'classnames';

// A button with the styles reset, for when you have something that
// functions as a button (and want to use the <button> tag for
// accessibility) but want it to look like just inline text.

import './BorderlessButton.css';

export default function BorderlessButton(props) {
  const { flex, ...rest } = props;
  return (
    <button
      className={classnames({
        BorderlessButton: true,
        BorderlessButton_flex: flex,
      })}
      {...rest}
    />
  );
}
