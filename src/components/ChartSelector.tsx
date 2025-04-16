import { useState } from 'react';
import { Select, Space, Button, Card, Checkbox } from 'antd';
import ChartVisualizer from './ChartVisualizer';

interface SheetData {
  name: string;
  columns: string[];
  data: any[];
}

interface ChartSelectorProps {
  sheets: SheetData[];
}

const ChartSelector: React.FC<ChartSelectorProps> = ({ sheets }) => {
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<{ [key: string]: string[] }>({});
  const [showCharts, setShowCharts] = useState(false);

  const handleSheetSelect = (checkedValues: string[]) => {
    setSelectedSheets(checkedValues);
    setShowCharts(false);
  };

  const handleColumnSelect = (sheetName: string, value: string[]) => {
    setSelectedColumns(prev => ({
      ...prev,
      [sheetName]: value
    }));
    setShowCharts(false);
  };

  const handleGenerateCharts = () => {
    if (selectedSheets.length > 0 && 
        selectedSheets.every(sheet => selectedColumns[sheet]?.length >= 2)) {
      setShowCharts(true);
    }
  };

  return (
    <Card title="图表选择" className="mb-4">
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <h4>选择工作表：</h4>
          <Checkbox.Group
            options={sheets.map(sheet => ({
              label: sheet.name,
              value: sheet.name
            }))}
            onChange={handleSheetSelect}
            value={selectedSheets}
          />
        </div>

        {selectedSheets.map(sheetName => {
          const sheet = sheets.find(s => s.name === sheetName);
          if (!sheet) return null;

          return (
            <div key={sheetName}>
              <h4>选择 {sheetName} 的列：</h4>
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder={`请选择 ${sheetName} 的列`}
                onChange={(value) => handleColumnSelect(sheetName, value)}
                value={selectedColumns[sheetName] || []}
                options={sheet.columns.map(column => ({
                  label: column,
                  value: column,
                }))}
              />
            </div>
          );
        })}

        {selectedSheets.length > 0 && 
         selectedSheets.every(sheet => selectedColumns[sheet]?.length >= 2) && (
          <Button type="primary" onClick={handleGenerateCharts}>
            生成图表
          </Button>
        )}

        {showCharts && selectedSheets.map(sheetName => {
          const sheet = sheets.find(s => s.name === sheetName);
          if (!sheet) return null;

          return (
            <div key={sheetName}>
              <ChartVisualizer
                title={sheetName}
                data={sheet.data}
                selectedColumns={selectedColumns[sheetName] || []}
              />
            </div>
          );
        })}
      </Space>
    </Card>
  );
};

export default ChartSelector; 