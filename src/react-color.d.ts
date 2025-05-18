declare module 'react-color' {
  import * as React from 'react';
  export interface ColorResult {
    hex: string;
    rgb: { r: number; g: number; b: number; a: number };
    hsl: { h: number; s: number; l: number; a: number };
  }
  export interface SketchPickerProps {
    color: string;
    onChange: (color: ColorResult) => void;
    presetColors?: string[];
    width?: string | number;
  }
  export class SketchPicker extends React.Component<SketchPickerProps> {}
} 