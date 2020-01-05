import React from "react";
import ReactDOM from "react-dom";

import "./styles.css";

import App from "./App";
ReactDOM.render(<App />, document.getElementById("root"));

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

class AuthWrapper extends React.Component {
  rerender = () => this.forceUpdate();
  render() {
    return <App rerender={this.rerender} />;
  }
}

ReactDOM.render(<AuthWrapper />, document.getElementById("root"));
