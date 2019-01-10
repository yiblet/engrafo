//@flow
import React from "react";
import Editor from "./editor";
type Prop = {};

export default function Comments(props: Prop) {
  return (
    <div className="comments">
      <Editor readOnly={true} />
    </div>
  );
}
