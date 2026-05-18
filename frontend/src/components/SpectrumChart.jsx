import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SpectrumChart = ({ data, series }) => {
  return (
    <div style={{ width: '100%', height: 400, background: '#1f1f1f', padding: '10px', borderRadius: '8px' }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis 
            dataKey="wavelength" 
            label={{ value: 'Wavelength (nm)', position: 'insideBottomRight', offset: -5, fill: '#888' }} 
            tick={{ fill: '#888' }}
          />
          <YAxis 
            label={{ value: 'Intensity', angle: -90, position: 'insideLeft', fill: '#888' }} 
            tick={{ fill: '#888' }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#141414', border: '1px solid #303030', borderRadius: '4px', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
            labelStyle={{ color: '#1890ff', fontWeight: 'bold' }}
            formatter={(value) => value.toFixed(4)}
          />
          <Legend />
          {series.map((s, idx) => (
            <Line 
              key={idx}
              type="monotone" 
              dataKey={s.key} 
              name={s.name} 
              stroke={s.color} 
              dot={false} 
              activeDot={{ r: 4 }} 
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SpectrumChart;
