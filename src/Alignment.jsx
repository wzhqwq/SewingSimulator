import { Fragment } from "react";

export default function Alignment({ x, y }) {
  return (
    <Fragment>
      <div className="align-h" style={{ top: `${y}px` }}></div>
      <div className="align-v" style={{ left: `${x}px` }}></div>
    </Fragment>
  )
}