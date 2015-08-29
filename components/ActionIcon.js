import React, { Component } from 'react';

class ActionIcon extends Component {
  render() {
    const { isActive, cssClasses, mdIconName, onClick, style, title } = this.props;
    const className= "material-icons action-icon " + cssClasses + (isActive ? "" : " md-inactive");
    const cursor = style.get('cursor');

    return (
      <i
        className={className}
        onClick={onClick}
        style={{ cursor: cursor || "pointer" }}
        title={title}>
        {mdIconName}
      </i>
    );
  }
}

export default ActionIcon;
