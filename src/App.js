// Create new file with App class component
import React, { Component } from "react";
import Amplify from "aws-amplify";
import { withAuthenticator } from "aws-amplify-react";

import { Grid, Header, List, Segment, Menu, Button } from "semantic-ui-react";
import "semantic-ui-css/semantic.css";

import { Auth } from "aws-amplify";

// Import API module and graphqlOperation method from Amplify library, Connect component will be used to execute query or mutation
import { graphqlOperation, API } from "aws-amplify";
import { Connect } from "aws-amplify-react";

import { Storage } from "aws-amplify";

Amplify.configure({
  Auth: {
    identityPoolId: "us-east-1:66ef229d-fdc1-4ddb-af5a-a8f152b169b2",
    region: "us-east-1",
    userPoolId: "us-east-1_2Oumgyn77",
    userPoolWebClientId: "3n5ddnttn8mh4i8jls7piearrn"
  },
  aws_appsync_graphqlEndpoint:
    "https://ezf6fxzimjgjncykh7kyi73toy.appsync-api.us-east-1.amazonaws.com/graphql",
  aws_appsync_region: "us-east-1",
  aws_appsync_authenticationType: "AMAZON_COGNITO_USER_POOLS"
});

Storage.configure({
  bucket: "shlomitest1",
  region: "us-east-1",
  identityPoolId: "us-east-1:66ef229d-fdc1-4ddb-af5a-a8f152b169b2"
});

const getObjects = `query {
  getObjects {
   objectId
  }
 }`;

const putObject = `mutation putObject($objectId: String!){
  putObject(objectId: $objectId) {
    objectId
    userId
  }
}`;

const getObject = `query getObject($objectId: String!){
  getObject(objectId: $objectId) {
    url
  }
}`;

class App extends Component {
  signOut = async () => {
    await Auth.signOut();
    this.props.rerender();
  };
  render() {
    return (
      <Grid padded>
        <Grid.Column>
          <Menu>
            <Menu.Item>
              <S3Upload />
            </Menu.Item>
            <Menu.Item>
              <Button onClick={this.signOut}>Sign-out</Button>
            </Menu.Item>
          </Menu>
          <Segment>
            <Header as="h3">My Files</Header>
          </Segment>
          <FilesListLoader />
        </Grid.Column>
      </Grid>
    );
  }
}
export default props => {
  const AppComponent = withAuthenticator(App);
  return <AppComponent {...props} />;
};

class S3Upload extends React.Component {
  constructor(props) {
    super(props);
    this.state = { uploading: false };
  }
  onChange = async e => {
    const file = e.target.files[0];
    this.setState({ uploading: true });
    const identityId = await Auth.currentSession()
      .then(data => {
        return data.idToken.payload.sub;
      })
      .catch(err => console.log(err));
    const result = await Storage.put(file.name, file, {
      identityId: identityId,
      level: "private",
      customPrefix: { private: "" }
    }).then(async () => {
      const result = await API.graphql(
        graphqlOperation(putObject, { objectId: file.name })
      );
      console.info(`Created object with id ${JSON.stringify(result)}`);
    });
    this.setState({ uploading: false });
  };
  render() {
    return (
      <div>
        <Button
          primary
          onClick={() => document.getElementById("uploadFile").click()}
          disabled={this.state.uploading}
          content={this.state.uploading ? "Uploading..." : "Upload file"}
        />
        <input
          id="uploadFile"
          type="file"
          onChange={this.onChange}
          style={{ display: "none" }}
        />
      </div>
    );
  }
}

class FileList extends React.Component {
  getUrl = async file => {
    const result = await API.graphql(
      graphqlOperation(getObject, { objectId: file })
    );
    window.location.assign(result.data.getObject.url);
  };
  Files() {
    if (this.props.files.length != 0) {
      return this.props.files.map(file => (
        <List.Item key={file.objectId}>
          <List.Content
            as="a"
            href="javascript:void(0)"
            onClick={() => {
              this.getUrl(file.objectId);
            }}
          >
            {file.objectId}
          </List.Content>
        </List.Item>
      ));
    } else {
      return (
        <List.Item>
          <List.Content>Your filestore is empty</List.Content>
        </List.Item>
      );
    }
  }
  render() {
    return (
      <Segment>
        <List divided verticalAlign="middle">
          {this.Files()}
        </List>
      </Segment>
    );
  }
}
// Add FilesListLoader class that queries the API
class FilesListLoader extends React.Component {
  render() {
    return (
      <Connect query={graphqlOperation(getObjects)}>
        {({ data, loading, errors }) => {
          if (loading) {
            return <div>Loading...</div>;
          }
          if (!data.getObjects) return;
          return <FileList files={data.getObjects} />;
        }}
      </Connect>
    );
  }
}
