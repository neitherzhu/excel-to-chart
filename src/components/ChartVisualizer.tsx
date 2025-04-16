import { useState, useMemo } from 'react';
import { Card, Radio, Space, Checkbox, Switch, Select as AntSelect, Modal, ColorPicker, Button } from 'antd';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    ComposedChart,
    LabelList,
    ResponsiveContainer,
    Text
} from 'recharts';
import { DownloadOutlined } from '@ant-design/icons';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';

interface ChartVisualizerProps {
    title: string;
    data: any[];
    selectedColumns: string[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

type DataFormat = 'normal' | 'percentage' | 'integer';

const ChartVisualizer: React.FC<ChartVisualizerProps> = ({ title, data, selectedColumns }) => {
    const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'combined'>('bar');
    const [barColumns, setBarColumns] = useState<string[]>([]);
    const [lineColumns, setLineColumns] = useState<string[]>([]);
    const [showDataLabels, setShowDataLabels] = useState<boolean>(false);
    const [columnFormats, setColumnFormats] = useState<Record<string, DataFormat>>({});
    const [yAxisFormats, setYAxisFormats] = useState<Record<string, DataFormat>>({});
    const [formatModalVisible, setFormatModalVisible] = useState<boolean>(false);
    const [groupModalVisible, setGroupModalVisible] = useState<boolean>(false);
    const [groupSettings, setGroupSettings] = useState<{
        xKey: string;
        groupBy: string;
        displayColumn: string;
    }>({
        xKey: '',
        groupBy: '',
        displayColumn: ''
    });
    const [barColors, setBarColors] = useState<Record<string, string>>({});
    const [colorModalVisible, setColorModalVisible] = useState<boolean>(false);

    const formatValue = (value: number, column: string) => {
        if (typeof value === 'string') return value

        const format = columnFormats[column] || 'normal';
        switch (format) {
            case 'percentage':
                return `${(value * 100).toFixed(0)}%`;
            case 'integer':
                return value.toFixed(0);
            default:
                return value.toFixed(2);
        }
    };

    const groupedData = useMemo(() => {
        const { xKey, groupBy, displayColumn } = groupSettings
        if (!xKey || !groupBy || !displayColumn) return { data: [], groupByKeys: [] };

        console.log(columnFormats, displayColumn)
        // 获取所有唯一的分组值（如月份）
        const uniqueKeys = [...new Set(data.map(item => item[xKey]))];
        const groupByKeys = [...new Set(data.map(item => item[groupBy]))];
        return {
            groupByKeys,
            data: uniqueKeys.map(key => {
                const v = data.filter(x => x[xKey] === key)
                const groupedMap = groupByKeys.reduce((cur, x) => {
                    const val = v.find(y => y[groupBy] === x)?.[displayColumn]
                    cur[x] = val ? formatValue(val, displayColumn) : val
                    return cur
                }, {})
                return {
                    [xKey]: key,
                    ...groupedMap
                }
            })
        }
    }, [data, groupSettings, selectedColumns, columnFormats]);

    const formatYAxisValue = (value: number, axisId: string) => {
        const format = yAxisFormats[axisId] || 'normal';
        switch (format) {
            case 'percentage':
                return `${(value * 100).toFixed(0)}%`;
            case 'integer':
                return value.toFixed(0);
            default:
                return value.toFixed(2);
        }
    };

    const handleFormatChange = (column: string, format: DataFormat) => {
        setColumnFormats(prev => ({
            ...prev,
            [column]: format
        }));
    };

    const handleYAxisFormatChange = (axisId: string, format: DataFormat) => {
        setYAxisFormats(prev => ({
            ...prev,
            [axisId]: format
        }));
    };

    const handleColorChange = (column: string, color: string) => {
        setBarColors(prev => ({
            ...prev,
            [column]: color
        }));
    };

    const handleExportChart = async () => {
        const chartElement = document.querySelector('.export-chart');
        if (!chartElement) return;

        try {
            const canvas = await html2canvas(chartElement as HTMLElement);
            canvas.toBlob((blob) => {
                if (blob) {
                    saveAs(blob, `${title}_${chartType}_chart.png`);
                }
            });
        } catch (error) {
            console.error('导出图表失败:', error);
        }
    };

    const renderChart = () => {
        if (selectedColumns.length === 0) return null;

        let finalSelectedColumns = selectedColumns
        let finalData = data
        let xAxisKey = selectedColumns[0]
        const { xKey, groupBy, displayColumn } = groupSettings

        const isEnableGroupBy = xKey && groupBy && displayColumn

        if (isEnableGroupBy) {
            finalSelectedColumns = [groupSettings.xKey, ...groupedData.groupByKeys]
            finalData = groupedData.data
            xAxisKey = groupSettings.xKey
        }

        const chartTitle = (
            <Text
                x="50%"
                y={-1}
                textAnchor="middle"
                style={{ fontSize: '16px', fontWeight: 'bold' }}
            >
                adkfhjklajdf
            </Text>
        );

        switch (chartType) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart 
                            data={finalData}
                            margin={{ top: 60, right: 30, left: 20, bottom: 5 }}
                        >
                            {chartTitle}
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={xAxisKey} />
                            <YAxis tickFormatter={(value) => formatYAxisValue(value, 'left')} />
                            <Tooltip formatter={(value: number, name: string) => formatValue(value, name)} />
                            <Legend />
                            {finalSelectedColumns.slice(1).map((column, index) => (
                                <Bar
                                    key={column}
                                    dataKey={column}
                                    fill={barColors[column] || COLORS[index % COLORS.length]}
                                    radius={[4, 4, 0, 0]}
                                    barSize={30}
                                    maxBarSize={40}
                                >
                                    {showDataLabels && (
                                        <LabelList
                                            dataKey={column}
                                            position="top"
                                            offset={10}
                                            style={{
                                                fontSize: '12px',
                                                fill: '#000',
                                                textShadow: '0 0 2px rgba(255,255,255,0.5)',
                                                fontWeight: 'bold'
                                            }}
                                            formatter={(value: number) => formatValue(value, column)}
                                        />
                                    )}
                                </Bar>
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart 
                            data={data}
                            margin={{ top: 40, right: 30, left: 20, bottom: 5 }}
                        >
                            {chartTitle}
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={xAxisKey} />
                            <YAxis tickFormatter={(value) => formatYAxisValue(value, 'left')} />
                            <Tooltip formatter={(value: number, name: string) => formatValue(value, name)} />
                            <Legend />
                            {selectedColumns.slice(1).map((column, index) => (
                                <Line
                                    key={column}
                                    type="monotone"
                                    dataKey={column}
                                    stroke={COLORS[index % COLORS.length]}
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                >
                                    {showDataLabels && (
                                        <LabelList
                                            dataKey={column}
                                            position="top"
                                            style={{
                                                fontSize: '12px',
                                                fill: '#000',
                                                textShadow: '0 0 2px rgba(255,255,255,0.5)',
                                                padding: '2px',
                                                backgroundColor: COLORS[index % COLORS.length],
                                                borderRadius: '4px'
                                            }}
                                            formatter={(value: number) => formatValue(value, column)}
                                        />
                                    )}
                                </Line>
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                            {chartTitle}
                            <Pie
                                data={data}
                                dataKey={selectedColumns[1]}
                                nameKey={selectedColumns[0]}
                                cx="50%"
                                cy="50%"
                                outerRadius={150}
                                label
                            >
                                {(data).map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                                {showDataLabels && (
                                    <LabelList
                                        dataKey="value"
                                        position="outside"
                                        style={{ fontSize: '12px', fill: '#000' }}
                                        formatter={(value: number) => formatValue(value, data[0]?.name || '')}
                                    />
                                )}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatValue(value, data[0]?.name || '')} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'combined':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <ComposedChart 
                            data={data}
                            margin={{ top: 40, right: 30, left: 20, bottom: 5 }}
                        >
                            {chartTitle}
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={xAxisKey} />
                            <YAxis yAxisId="left" tickFormatter={(value) => formatYAxisValue(value, 'left')} />
                            <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => formatYAxisValue(value, 'right')} />
                            <Tooltip formatter={(value: number, name: string) => formatValue(value, name)} />
                            <Legend />
                            {barColumns.map((column, index) => {
                                return <Bar
                                    key={column}
                                    yAxisId="left"
                                    dataKey={column}
                                    fill={COLORS[index % COLORS.length]}
                                    name={`柱状图-${column}`}
                                    radius={[4, 4, 0, 0]}
                                    barSize={30}
                                    maxBarSize={40}
                                >
                                    {showDataLabels && (
                                        <LabelList
                                            dataKey={column}
                                            position="top"
                                            offset={10}
                                            style={{
                                                fontSize: '12px',
                                                fill: '#000',
                                                textShadow: '0 0 2px rgba(255,255,255,0.5)',
                                                fontWeight: 'bold'
                                            }}
                                            formatter={(value: number) => formatValue(value, column)}
                                        />
                                    )}
                                </Bar>
                            })}
                            {lineColumns.map((column, index) => {
                                return (
                                    <Line
                                        key={column}
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey={column}
                                        stroke={COLORS[(index + barColumns.length) % COLORS.length]}
                                        name={`折线图-${column}`}
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    >
                                        {showDataLabels && (
                                            <LabelList
                                                dataKey={column}
                                                position="top"
                                                style={{
                                                    fontSize: '12px',
                                                    fill: '#000',
                                                    textShadow: '0 0 2px rgba(255,255,255,0.5)',
                                                    padding: '2px',
                                                    backgroundColor: COLORS[(index + barColumns.length) % COLORS.length],
                                                    borderRadius: '4px'
                                                }}
                                                formatter={(value: number) => formatValue(value, column)}
                                            />
                                        )}
                                    </Line>
                                );
                            })}
                        </ComposedChart>
                    </ResponsiveContainer>
                );

            default:
                return null;
        }
    };

    return (
        <div>
            <div className='my-4'>
                <Space>
                    <Radio.Group
                        value={chartType}
                        onChange={(e) => setChartType(e.target.value)}
                        buttonStyle="solid"
                    >
                        <Radio.Button value="bar">柱状图</Radio.Button>
                        <Radio.Button value="line">折线图</Radio.Button>
                        <Radio.Button value="pie">饼图</Radio.Button>
                        <Radio.Button value="combined">组合图</Radio.Button>
                    </Radio.Group>
                    <Switch
                        checkedChildren="显示数据"
                        unCheckedChildren="隐藏数据"
                        checked={showDataLabels}
                        onChange={setShowDataLabels}
                    />
                    <AntSelect
                        value="format"
                        onClick={() => setFormatModalVisible(true)}
                        style={{ width: 120 }}
                    >
                        <AntSelect.Option value="format">数据格式设置</AntSelect.Option>
                    </AntSelect>
                    <AntSelect
                        value="group"
                        onClick={() => setGroupModalVisible(true)}
                        style={{ width: 120 }}
                    >
                        <AntSelect.Option value="group">分组设置</AntSelect.Option>
                    </AntSelect>
                    {chartType === 'bar' && (
                        <AntSelect
                            value="color"
                            onClick={() => setColorModalVisible(true)}
                            style={{ width: 120 }}
                        >
                            <AntSelect.Option value="color">颜色设置</AntSelect.Option>
                        </AntSelect>
                    )}
                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={handleExportChart}
                    >
                        导出图表
                    </Button>
                </Space>

                {chartType === 'combined' && (
                    <Space direction="vertical" style={{ width: '100%', marginTop: '16px' }}>
                        <div>
                            <h4>选择柱状图数据列：</h4>
                            <Checkbox.Group
                                options={selectedColumns.slice(1).map(col => ({
                                    label: col,
                                    value: col
                                }))}
                                value={barColumns}
                                onChange={setBarColumns}
                            />
                        </div>
                        <div>
                            <h4>选择折线图数据列：</h4>
                            <Checkbox.Group
                                options={selectedColumns.slice(1).map(col => ({
                                    label: col,
                                    value: col
                                }))}
                                value={lineColumns}
                                onChange={setLineColumns}
                            />
                        </div>
                    </Space>
                )}
            </div>
            <Card title={title} className="export-chart">
                <Space direction="vertical" style={{ width: '100%' }}>


                    <div style={{ overflowX: 'auto' }}>
                        {renderChart()}
                    </div>

                    <Modal
                        title="数据格式设置"
                        open={formatModalVisible}
                        onCancel={() => setFormatModalVisible(false)}
                        footer={null}
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <h4>Y轴格式：</h4>
                                {chartType === 'combined' ? (
                                    <>
                                        <div style={{ marginBottom: '8px' }}>
                                            <span>左侧Y轴：</span>
                                            <AntSelect
                                                value={yAxisFormats['left'] || 'normal'}
                                                onChange={(value) => handleYAxisFormatChange('left', value as DataFormat)}
                                                style={{ width: '120px' }}
                                            >
                                                <AntSelect.Option value="normal">保留2位小数</AntSelect.Option>
                                                <AntSelect.Option value="percentage">百分比</AntSelect.Option>
                                                <AntSelect.Option value="integer">整数</AntSelect.Option>
                                            </AntSelect>
                                        </div>
                                        <div>
                                            <span>右侧Y轴：</span>
                                            <AntSelect
                                                value={yAxisFormats['right'] || 'normal'}
                                                onChange={(value) => handleYAxisFormatChange('right', value as DataFormat)}
                                                style={{ width: '120px' }}
                                            >
                                                <AntSelect.Option value="normal">保留2位小数</AntSelect.Option>
                                                <AntSelect.Option value="percentage">百分比</AntSelect.Option>
                                                <AntSelect.Option value="integer">整数</AntSelect.Option>
                                            </AntSelect>
                                        </div>
                                    </>
                                ) : (
                                    <AntSelect
                                        value={yAxisFormats['left'] || 'normal'}
                                        onChange={(value) => handleYAxisFormatChange('left', value as DataFormat)}
                                        style={{ width: '120px' }}
                                    >
                                        <AntSelect.Option value="normal">保留2位小数</AntSelect.Option>
                                        <AntSelect.Option value="percentage">百分比</AntSelect.Option>
                                        <AntSelect.Option value="integer">整数</AntSelect.Option>
                                    </AntSelect>
                                )}
                            </div>
                            <h4>数据列格式：</h4>
                            {selectedColumns.slice(1).map(column => (
                                <div key={column} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '100px' }}>{column}</span>
                                    <AntSelect
                                        value={columnFormats[column] || 'normal'}
                                        onChange={(value) => handleFormatChange(column, value as DataFormat)}
                                        style={{ width: '120px' }}
                                    >
                                        <AntSelect.Option value="normal">保留2位小数</AntSelect.Option>
                                        <AntSelect.Option value="percentage">百分比</AntSelect.Option>
                                        <AntSelect.Option value="integer">整数</AntSelect.Option>
                                    </AntSelect>
                                </div>
                            ))}
                        </Space>
                    </Modal>

                    <Modal
                        title="数据分组设置"
                        open={groupModalVisible}
                        onCancel={() => setGroupModalVisible(false)}
                        footer={null}
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <h4>x轴列：</h4>
                                <AntSelect
                                    value={groupSettings.xKey}
                                    onChange={(value) => setGroupSettings(prev => ({ ...prev, xKey: value }))}
                                    style={{ width: '100%' }}
                                    placeholder="x轴列"
                                >
                                    {selectedColumns.map(column => (
                                        <AntSelect.Option key={column} value={column}>{column}</AntSelect.Option>
                                    ))}
                                </AntSelect>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <h4>分组列：</h4>
                                <AntSelect
                                    value={groupSettings.groupBy}
                                    onChange={(value) => setGroupSettings(prev => ({ ...prev, groupBy: value }))}
                                    style={{ width: '100%' }}
                                    placeholder="选择要分组的列"
                                >
                                    {selectedColumns.filter(x => x !== groupSettings.xKey).map(column => (
                                        <AntSelect.Option key={column} value={column}>{column}</AntSelect.Option>
                                    ))}
                                </AntSelect>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <h4>显示列：</h4>
                                <AntSelect
                                    value={groupSettings.displayColumn}
                                    onChange={(value) => setGroupSettings(prev => ({ ...prev, displayColumn: value }))}
                                    style={{ width: '100%' }}
                                    placeholder="选择要显示的列"
                                >
                                    {selectedColumns.filter(x => x !== groupSettings.xKey && x !== groupSettings.groupBy).map(column => (
                                        <AntSelect.Option key={column} value={column}>{column}</AntSelect.Option>
                                    ))}
                                </AntSelect>
                            </div>
                        </Space>
                    </Modal>

                    <Modal
                        title="柱状图颜色设置"
                        open={colorModalVisible}
                        onCancel={() => setColorModalVisible(false)}
                        footer={null}
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {selectedColumns.slice(1).map((column: string) => (
                                <div key={column} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '100px' }}>{column}</span>
                                    <ColorPicker
                                        value={barColors[column] || COLORS[selectedColumns.slice(1).indexOf(column) % COLORS.length]}
                                        onChange={(color) => handleColorChange(column, color.toHexString())}
                                    />
                                </div>
                            ))}
                        </Space>
                    </Modal>
                </Space>
            </Card>
        </div>
    );
};

export default ChartVisualizer; 