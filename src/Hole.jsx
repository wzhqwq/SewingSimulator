export default function Hole({ x, y, degree, onClick }) {
  return (
    <div className='hole' style={{ top: `${y}px`, left: `${x}px` }} onClick={onClick}></div>
  );
}