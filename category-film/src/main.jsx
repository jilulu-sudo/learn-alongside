import { createRoot } from 'react-dom/client';
import { config } from './film.config.js';
import { App } from './player/App.jsx';
import './player/player.css';

const root = document.documentElement;
for (const [name, value] of Object.entries(config.palette)) root.style.setProperty(`--${name}`, value);
root.style.setProperty('--serif', config.fonts.serif);

createRoot(document.getElementById('root')).render(<App />);
