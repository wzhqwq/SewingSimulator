export default function Stroke({ x1, y1, x2, y2, color }) {
  return (
    <div className='stroke' style={{
      top: `${y1}px`,
      left: `${x1}px`,
      width: `${Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)}px`,
      transform: `rotateZ(${(x2 < x1 ? Math.PI : 0) + Math.atan((y2 - y1) / (x2 - x1))}rad)`,
      backgroundColor: color,
    }}></div>
  );
}