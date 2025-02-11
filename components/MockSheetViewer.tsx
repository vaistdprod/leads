"use client";
import React from 'react';

interface MockSheetViewerProps {
  data: string[][];
}

const MockSheetViewer: React.FC<MockSheetViewerProps> = ({ data }) => {
  return (
    <div className="overflow-x-auto">
      <table className="table-auto border-collapse border border-gray-400">
        <thead>
          <tr>
            {data[0]?.map((header, index) => (
              <th key={index} className="border border-gray-400 px-4 py-2">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(1).map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="border border-gray-400 px-4 py-2">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MockSheetViewer;
