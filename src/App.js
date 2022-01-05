import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Divider, Fab, Chip, Snackbar, Alert, Switch, FormLabel, FormControlLabel } from '@mui/material';
import { Add, Undo, Delete, Clear, FlipToFront, FlipToBack } from '@mui/icons-material';

import './App.css';
import Hole from './Hole';
import Stroke from './Stroke';
import Alignment from './Alignment';

const colors = ['#4444', '#444'];

function App() {
  const [bgFile, setBgFile] = useState(null);
  const [img, setImg] = useState(null);
  const [points, setPoints] = useState([]);
  const [strokes, setStrokes] = useState([]);
  const [mouseX, setMouseX] = useState(null);
  const [mouseY, setMouseY] = useState(null);
  const [layerNow, setLayerNow] = useState(0);
  const [reversed, setReversed] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [hideHoles, setHideHoles] = useState(false);
  const [showAlignment, setShowAlignment] = useState(false);
  const [saveTipOpen, setSaveTipOpen] = useState(false);
  const pointSelected = useRef(null);
  const workSpace = useRef(null);
  const lastPoint = useMemo(
    () => strokes.length ? strokes[strokes.length - 1].v : (points.length ? 0 : null),
    [strokes, points]
  );

  const handleFileChange = useCallback(({ target }) => {
    if (target.files.length) {
      setBgFile(target.files[0]);
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImg(reader.result);
    };
    reader.readAsDataURL(target.files[0]);
  }, []);

  const handleClick = useCallback(() => {
    if (lastPoint != null) {
      let u = lastPoint, v;
      if (pointSelected.current != null) {
        v = pointSelected.current;
        pointSelected.current = null;
        points[v].degree++;
      }
      else {
        v = points.length;
        setPoints([...points, { x: mouseX + offsetX, y: mouseY + offsetY, degree: 1 }]);
      }
      console.log(u, v)
      points[u].degree++;
      setStrokes([...strokes, { u, v, layer: layerNow }]);
    }
    else {
      setPoints([{ x: mouseX + offsetX, y: mouseY + offsetY, degree: 0 }]);
    }
    setLayerNow(layer => 1 - layer);
  }, [mouseX, mouseY, points, strokes, layerNow, lastPoint, offsetX, offsetY]);

  const handleMove = useCallback(({ clientX, clientY }) => {
    setMouseX(clientX);
    setMouseY(clientY);
  }, []);

  const handleClear = useCallback(() => {
    setPoints([]);
    setStrokes([]);
  }, []);

  const handleUndo = useCallback(() => {
    if (!points.length) return;
    if (!strokes.length) {
      setPoints([])
      setLayerNow(0);
      return;
    }
    setLayerNow(layer => 1 - layer);
    setStrokes(strokes.slice(0, -1));

    const {u, v} = strokes[strokes.length - 1];
    points[u].degree--;
    points[v].degree--;
    if (!points[u].degree || !points[v].degree) {
      if (!points[u].degree && strokes.length !== 1) points[u] = undefined;
      if (!points[v].degree) points[v] = undefined;
      setPoints([...points]);
    }
  }, [points, strokes]);

  const handleSave = useCallback(() => {
    localStorage.setItem('data', JSON.stringify({ points, strokes }));
    setSaveTipOpen(true);
  }, [points, strokes]);

  const handleLoad = useCallback(() => {
    const data = JSON.parse(localStorage.getItem('data') ?? '{}');
    if (!data.points) return;
    setPoints(data.points);
    setStrokes(data.strokes);
  }, [])

  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      switch (e.key) {
        case 'z':
          handleUndo();
          break;
        case 's':
          handleSave();
          break;
        case 'l':
          handleLoad();
          break;
        default:
          break;
      }
    }
    if (e.key === 'Alt') {
      e.preventDefault();
      setHideHoles(true);
    }
  }, [handleUndo, handleSave, handleLoad]);
  const handleKeyUp = useCallback((e) => {
    if (e.key === 'Alt') {
      e.preventDefault();
      setHideHoles(false);
    }
  }, []);
  const handleScroll = useCallback(() => {
    const {x, y} = workSpace.current.getBoundingClientRect();
    setOffsetX(-x);
    setOffsetY(-y);
  }, []);
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    const {x, y} = workSpace.current.getBoundingClientRect();
    setOffsetX(-x);
    setOffsetY(-y);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    }
  }, [handleKeyDown]);

  return (
    <div className="App">
      <div className='title-bar'>
        {
          bgFile && img ? (
            <Button color='secondary' size='medium' variant='contained' onClick={() => {
              setImg(null);
              setBgFile(null);
            }}>
              <Clear />
              移除参考图
            </Button>
          ) : (
            <Button color='primary' size='medium' variant='contained' disabled={bgFile && !img}>
              <Add />
              {bgFile && !img ? "添加中" : "添加参考图"}
              <input type='file' onChange={handleFileChange} className='hidden-file' accept='image/*' />
            </Button>
          )
        }
        <Divider orientation='vertical' flexItem />
        <Button color='primary' size='medium' variant='contained' onClick={handleSave}>
          保存设计<kbd>Ctrl</kbd>+<kbd>S</kbd>
        </Button>
        <Button color='primary' size='medium' variant='contained' onClick={handleLoad}>
          加载设计<kbd>Ctrl</kbd>+<kbd>L</kbd>
        </Button>
        <Divider orientation='vertical' flexItem />
        <FormControlLabel control={(
          <Switch checked={showAlignment} onChange={e => setShowAlignment(e.target.checked)}  />
        )} label='显示参考线' />
      </div>
      <div className='scrollable' onScroll={handleScroll}>
        <div
          className={'workspace' + (hideHoles ? ' hide-holes' : '')}
          onClick={handleClick}
          onMouseMove={handleMove}
          ref={workSpace}
        >
          {
            img && (
              <img src={img} className='ref-graph' alt='参考图片' />
            )
          }
          {
            points.map((p, i) => p && (
              <Hole {...p} onClick={() => pointSelected.current = i} key={i} />
            ))
          }
          {
            strokes.map((s, i) => (
              <Stroke
                x1={points[s.u].x}
                y1={points[s.u].y}
                x2={points[s.v].x}
                y2={points[s.v].y}
                color={colors[reversed ? (1 - s.layer) : s.layer]}
                key={i}
              />
            ))
          }
          {
            lastPoint != null &&  (
              <Stroke
                x1={points[lastPoint].x}
                y1={points[lastPoint].y}
                x2={mouseX + offsetX}
                y2={mouseY + offsetY}
                color={colors[reversed ? (1 - layerNow) : layerNow]}
              />
            )
          }
          {
            showAlignment && (
              <Alignment x={mouseX + offsetX} y={mouseY + offsetY} />
            )
          }
        </div>
        <div className='tools'>
          <Fab size='medium' color='primary' aria-label='撤销' onClick={handleUndo}>
            <Undo />
          </Fab>
          <Fab size='medium' color='secondary' aria-label='清除' onClick={handleClear}>
            <Delete />
          </Fab>
          <Fab
            size='medium'
            color={reversed ? 'default' : 'primary'}
            aria-label='翻转'
            onClick={() => setReversed(!reversed)}
          >
            {reversed ? (<FlipToFront color='primary' />) : (<FlipToBack />)}
          </Fab>
        </div>
        <div className='status'>
          <Chip label={reversed ? '反面' : '正面'} />
        </div>
      </div>
      <Snackbar onClose={() => setSaveTipOpen(false)} open={saveTipOpen} autoHideDuration={1000}>
        <Alert severity="success" variant='filled' sx={{ width: '100%' }}>
          已保存
        </Alert>
      </Snackbar>
    </div>
  );
}

export default App;
