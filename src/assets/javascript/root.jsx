//@flow
import Popover from "./components/Popover";
import Comment from "./components/Comment";
import Editor from "./components/Editor";
import React from "react";
import ReactDOM from "react-dom";
import { QueryRenderer, graphql } from "react-relay";
import environment from "./environment";

const query = graphql`
  query rootQuery {
    comments(orderBy: startId_ASC) {
      id
      ...Comment_comments
    }
  }
`;

function render({ error, props }) {
  if (error) {
    return <div>{error.message}</div>;
  }
  if (!props) {
    return (
      <React.Fragment>
        <Popover />
      </React.Fragment>
    );
  } else {
    return (
      <React.Fragment>
        <Comment comments={props.comments} />
        <Popover />
      </React.Fragment>
    );
  }
}

export default function setupReact(el: Element) {
  let comments = el.querySelector("#comments");
  if (comments)
    ReactDOM.render(
      <QueryRenderer
        environment={environment}
        query={query}
        variables={{}}
        render={render}
      />,
      comments
    );
}
