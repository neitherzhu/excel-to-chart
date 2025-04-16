import { useState } from 'react'
import { Upload, Button, Table, Space, Card, Select, Checkbox } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import * as XLSX from 'xlsx'
import type { UploadProps } from 'antd'
import ChartSelector from './components/ChartSelector'
import './App.css'

interface ExcelData {
  columns: any[]
  dataSource: any[]
}

interface ExcelRow {
  [key: string]: any
}

interface SheetData {
  name: string
  data: ExcelData
}

function App() {
  const [sheets, setSheets] = useState<SheetData[]>([])
  const [activeSheet, setActiveSheet] = useState<string>('')
  const [selectedRows, setSelectedRows] = useState<React.Key[]>([])
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])

  const handleFileUpload: UploadProps['onChange'] = (info) => {
    const file = info.file.originFileObj
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'array' })
        
        const sheetData: SheetData[] = workbook.SheetNames.map(sheetName => {
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet)

          console.log(workbook)
          if (jsonData.length > 0) {
            const columns = Object.keys(jsonData[0]).map(key => ({
              title: key,
              dataIndex: key,
              key: key,
            }))

            return {
              name: sheetName,
              data: {
                columns,
                dataSource: jsonData.map((row, index) => ({
                  ...row,
                  key: index.toString()
                }))
              }
            }
          }
          return {
            name: sheetName,
            data: {
              columns: [],
              dataSource: []
            }
          }
        })

        setSheets(sheetData)
        if (sheetData.length > 0) {
          setActiveSheet(sheetData[0].name)
          setSelectedColumns(sheetData[0].data.columns.map(col => col.key))
        }
        setSelectedRows([])
      }
      reader.readAsArrayBuffer(file)
    }
  }

  const currentSheet = sheets.find(sheet => sheet.name === activeSheet)

  const rowSelection = {
    selectedRowKeys: selectedRows,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRows(newSelectedRowKeys)
    },
  }

  const getFilteredData = () => {
    if (!currentSheet) return []
    return currentSheet.data.dataSource.filter(item => 
      selectedRows.includes(item.key)
    )
  }

  const getVisibleColumns = () => {
    if (!currentSheet) return []
    return currentSheet.data.columns.filter(col => 
      selectedColumns.includes(col.key)
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Card title="Excel 数据可视化" className="mb-4">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Upload
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>上传 Excel 文件</Button>
          </Upload>
          
          {sheets.length > 0 && (
            <Select
              style={{ width: 200 }}
              value={activeSheet}
              onChange={setActiveSheet}
              placeholder="请选择工作表"
              options={sheets.map(sheet => ({
                label: sheet.name,
                value: sheet.name
              }))}
            />
          )}
          
          {currentSheet && currentSheet.data.columns.length > 0 && (
            <>
              <div>
                <h4>选择要显示的列：</h4>
                <Checkbox.Group
                  options={currentSheet.data.columns.map(col => ({
                    label: col.title,
                    value: col.key
                  }))}
                  value={selectedColumns}
                  onChange={setSelectedColumns}
                />
              </div>

              <Table
                rowSelection={rowSelection}
                columns={getVisibleColumns()}
                dataSource={currentSheet.data.dataSource}
                scroll={{ x: true }}
                rowKey="key"
              />
              <ChartSelector
                sheets={sheets.map(sheet => ({
                  name: sheet.name,
                  columns: sheet.data.columns
                    .filter(col => selectedColumns.includes(col.key))
                    .map(col => col.title),
                  data: sheet.name === activeSheet ? getFilteredData() : sheet.data.dataSource
                }))}
              />
            </>
          )}
        </Space>
      </Card>
    </div>
  )
}

export default App
