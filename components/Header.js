import React, { Component } from 'react';
import Spinner from './Spinner';
import { handleGetProfile } from '../utils/auth0';

class LoginBox extends Component {
  handleSignIn() {
    const { app, actions } = this.props;
    app.getIn(['auth0', 'lock']).show({ gravatar: false }, function (err, profile, idToken) {
      localStorage.setItem('userToken', idToken);
      handleGetProfile(actions, err, profile);
    });
  }

  render() {
    const { app } = this.props;
    const userIsAuthenticated = app.get('userIsAuthenticated');

    return (
      <div className="login-box">
        <h4
          className="action"
          onClick={function () {
            if (userIsAuthenticated) {
              this.props.actions.signOut();
            } else {
              this.handleSignIn();
            }
          }.bind(this)}
          style={{ color: "#ccc", margin: 0, textDecoration: "none" }}>
          {userIsAuthenticated ? "sign out" : "sign in"}
        </h4>
      </div>
    );
  }
}

class Header extends Component {
  render() {
    const { app } = this.props;
    return (
      <nav style={{borderBottom: "1px solid #ccc", marginBottom: "2rem"}}>
        <div className="container">
          {this.renderTopbar()}
          <div className="u-full-width justify-space-between" style={{borderBottom: 0}}>
            <h1 style={{marginBottom: 0}}>
              <a href="/" style={{color: "#0d698d"}}>Island</a>
            </h1>
            <LoginBox {...this.props} />
          </div>
        </div>
      </nav>
    );
  }

  renderTopbar() {
    const { app } = this.props;
    const { error, showError, showSpinner } = app.toJS();

    return (showSpinner ?
      <Spinner /> :
      showError ?
        <div style={{ textAlign: "center" }}>
          <strong style={{ color: "red", fontSize: "19px"}}>{error}</strong>
        </div> :
        <div style={{ color: "#fff" }}>placeholder</div>
      );
  }
}

export default Header;
