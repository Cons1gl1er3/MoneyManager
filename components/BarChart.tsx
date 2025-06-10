import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import { Dimensions, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const screenWidth = Dimensions.get('window').width;

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface AxisConfig {
  showGrid?: boolean;
  gridColor?: string;
  labelColor?: string;
  labelSize?: number;
  labelRotation?: boolean;
}

interface YAxisConfig extends AxisConfig {
  numberOfTicks?: number;
  minValue?: number;
  maxValue?: number;
  showTitle?: boolean;
  title?: string;
}

interface XAxisConfig extends AxisConfig {
  showTitle?: boolean;
  title?: string;
  labelFormatter?: (value: string) => string;
}

interface TooltipData {
  month: string;
  income: number;
  expense: number;
  position: { x: number; y: number };
}

interface BarChartComponentProps {
  data: MonthlyData[];
  height?: number;
  yAxisConfig?: YAxisConfig;
  xAxisConfig?: XAxisConfig;
  barWidth?: number;
  barSpacing?: number;
  showTooltip?: boolean;
  currencySymbol?: string;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  noDataContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  noDataText: {
    color: '#6b7280',
    fontSize: 18,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 32,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1,
  },
  tooltipContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 320,
    zIndex: 2,
  },
  tooltipTitle: {
    fontSize: Platform.OS === 'ios' ? 18 : 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: Platform.OS === 'ios' ? 16 : 24,
  },
  tooltipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  tooltipLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tooltipValueContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 20,
  },
  tooltipDivider: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
    marginTop: 8,
  },
  closeButton: {
    marginTop: 32,
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  tooltipContent: {
    backgroundColor: 'white',
    borderRadius: Platform.OS === 'ios' ? 16 : 20,
    padding: Platform.OS === 'ios' ? 24 : 32,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: Platform.OS === 'ios' ? 4 : 8 
    },
    shadowOpacity: Platform.OS === 'ios' ? 0.25 : 0.3,
    shadowRadius: Platform.OS === 'ios' ? 8 : 16,
    elevation: Platform.OS === 'android' ? 16 : 0,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    minWidth: Platform.OS === 'web' ? 320 : Platform.OS === 'ios' ? 280 : 300,
    maxWidth: '90%',
    zIndex: 2,
  },
  tooltipAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  tooltipCloseButton: {
    marginTop: Platform.OS === 'ios' ? 20 : 24,
    backgroundColor: '#3b82f6',
    paddingVertical: Platform.OS === 'ios' ? 14 : 16,
    paddingHorizontal: Platform.OS === 'ios' ? 24 : 32,
    borderRadius: Platform.OS === 'ios' ? 10 : 12,
    minHeight: Platform.OS === 'ios' ? 44 : 48,
    justifyContent: 'center',
  },
  tooltipCloseText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: Platform.OS === 'ios' ? 16 : 16,
  },
  tooltipHeaderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  tooltipContentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  tooltipCloseCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  tooltipRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  tooltipRowLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  tooltipRowValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
});

const BarChartComponent: React.FC<BarChartComponentProps> = ({ 
  data, 
  height = 280,
  yAxisConfig = {},
  xAxisConfig = {},
  barWidth = 15,
  barSpacing = 4,
  showTooltip = true,
  currencySymbol = 'VND'
}) => {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [showTooltipModal, setShowTooltipModal] = useState(false);

  // Default configurations
  const defaultYAxisConfig: YAxisConfig = {
    showGrid: true,
    gridColor: '#f3f4f6',
    labelColor: '#6b7280',
    labelSize: 8,
    numberOfTicks: 5,
    showTitle: true,
    title: currencySymbol,
    ...yAxisConfig
  };

  const defaultXAxisConfig: XAxisConfig = {
    showGrid: false,
    labelColor: '#6b7280',
    labelSize: 10,
    labelRotation: false,
    showTitle: true,    
    title: '',
    labelFormatter: (value) => value,
    ...xAxisConfig
  };

  // Calculate max value for scaling
  const calculatedMaxValue = Math.max(
    ...data.flatMap(item => [item.income, item.expense]),
    100000 // Minimum scale
  );

  const maxValue = defaultYAxisConfig.maxValue || calculatedMaxValue;
  const minValue = defaultYAxisConfig.minValue || 0;

  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    })
      .format(value)
      .replace('₫', currencySymbol);
  };

  const handleBarPress = (item: MonthlyData, position: { x: number; y: number }) => {
    if (!showTooltip) return;
    
    setTooltip({
      month: item.month,
      income: item.income,
      expense: item.expense,
      position
    });
    setShowTooltipModal(true);
  };

  if (data.length === 0) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }

  const chartHeight = height - 120; // Reserve more space for labels and title
  const yAxisWidth = 50; // Space for Y-axis labels
  const xAxisHeight = 50; // Space for X-axis labels
  const chartWidth = screenWidth - 64 - yAxisWidth; // Adjust for Y-axis space

  // Generate Y-axis tick values
  const generateYAxisTicks = () => {
    const ticks = [];
    const step = (maxValue - minValue) / (defaultYAxisConfig.numberOfTicks! - 1);
    for (let i = 0; i < defaultYAxisConfig.numberOfTicks!; i++) {
      ticks.push(minValue + (step * i));
    }
    return ticks.reverse(); // Reverse to show highest value at top
  };

  const yAxisTicks = generateYAxisTicks();

  return (
    <View style={styles.container}>
      {/* Y-axis Title */}
      {defaultYAxisConfig.showTitle && (
        <View style={{ 
          position: 'absolute', 
          left: 8, 
          top: height / 2 - 20 
        }}>
          <View style={{ transform: [{ rotate: '-90deg' }] }}>
            <Text 
              style={{ 
                color: defaultYAxisConfig.labelColor,
                fontSize: defaultYAxisConfig.labelSize! + 2,
                fontWeight: 'bold'
              }}
            >
              {defaultYAxisConfig.title}
            </Text>
          </View>
        </View>
      )}

      <View style={{ flexDirection: 'row' }}>
        {/* Y-axis */}
        <View style={{ width: yAxisWidth, height: chartHeight, position: 'relative' }}>
          {yAxisTicks.map((tick, index) => (
            <View 
              key={index} 
              style={{
                position: 'absolute',
                top: (index / (yAxisTicks.length - 1)) * (chartHeight - 20) + 10 - 8, // Offset for text height
                right: 4,
                alignItems: 'flex-end'
              }}
            >
              <Text 
                style={{ 
                  color: defaultYAxisConfig.labelColor,
                  fontSize: defaultYAxisConfig.labelSize,
                  textAlign: 'right',
                  lineHeight: 16
                }}
              >
                {formatValue(tick)}
              </Text>
            </View>
          ))}
        </View>

        {/* Chart Area */}
        <View style={{ width: chartWidth, height: chartHeight, position: 'relative' }}>
          {/* Grid Lines */}
          {defaultYAxisConfig.showGrid && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: chartHeight }}>
              {yAxisTicks.map((tick, index) => {
                const gridTop = (index / (yAxisTicks.length - 1)) * (chartHeight - 20) + 10;
                return (
                  <View 
                    key={index}
                    style={{
                      position: 'absolute',
                      top: gridTop,
                      left: 0,
                      right: 0,
                      height: 1,
                      backgroundColor: defaultYAxisConfig.gridColor,
                    }}
                  />
                );
              })}
            </View>
          )}

          {/* Bars Container - positioned to align with grid */}
          <View style={{ 
            position: 'absolute',
            top: 10,
            left: 0,
            right: 0,
            height: chartHeight - 20,
            flexDirection: 'row', 
            alignItems: 'flex-end', 
            justifyContent: 'space-evenly',
            paddingHorizontal: 10
          }}>
            {data.map((item, index) => {
              // Calculate heights based on the exact same scale as grid lines
              const availableHeight = chartHeight - 20; // Same as grid line calculation
              const incomeHeight = ((item.income - minValue) / (maxValue - minValue)) * availableHeight;
              const expenseHeight = ((item.expense - minValue) / (maxValue - minValue)) * availableHeight;
              
              return (
                <TouchableOpacity 
                  key={index} 
                  style={{ alignItems: 'center' }}
                  onPress={(event) => {
                    const { pageX, pageY } = event.nativeEvent;
                    handleBarPress(item, { x: pageX, y: pageY });
                  }}
                  activeOpacity={0.7}
                >
                  {/* Bars Container */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                    {/* Income Bar */}
                    <View
                      style={{
                        width: barWidth,
                        height: Math.max(incomeHeight, minValue === 0 ? 0 : 2), // Show 0 height if value is 0
                        backgroundColor: '#22c55e', // Green
                        marginRight: barSpacing,
                        borderRadius: incomeHeight > 4 ? 2 : 0, // No radius for very small bars
                        elevation: 1,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 1,
                      }}
                    />
                    {/* Expense Bar */}
                    <View
                      style={{
                        width: barWidth,
                        height: Math.max(expenseHeight, minValue === 0 ? 0 : 2), // Show 0 height if value is 0
                        backgroundColor: '#ef4444', // Red
                        borderRadius: expenseHeight > 4 ? 2 : 0, // No radius for very small bars
                        elevation: 1,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 1,
                      }}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* X-axis */}
      <View style={{ width: chartWidth, marginLeft: yAxisWidth, marginTop: 4 }}>
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-evenly',
          alignItems: 'center',
          paddingHorizontal: 10
        }}>
          {data.map((item, index) => (
            <View key={index} style={{ alignItems: 'center', flex: 1 }}>
              <Text 
                style={{ 
                  color: defaultXAxisConfig.labelColor,
                  fontSize: defaultXAxisConfig.labelSize,
                  textAlign: 'center',
                  transform: defaultXAxisConfig.labelRotation ? [{ rotate: '-45deg' }] : undefined
                }}
              >
                {defaultXAxisConfig.labelFormatter!(item.month)}
              </Text>
            </View>
          ))}
        </View>
        
        {/* X-axis Title */}
        {defaultXAxisConfig.showTitle && defaultXAxisConfig.title && (
          <Text 
            style={{ 
              color: defaultXAxisConfig.labelColor,
              fontSize: defaultXAxisConfig.labelSize! + 2,
              fontWeight: 'bold',
              textAlign: 'center',
              marginTop: 8
            }}
          >
            {defaultXAxisConfig.title}
          </Text>
        )}
      </View>
      
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.legendText}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>Expense</Text>
        </View>
      </View>

      {/* Tooltip Modal */}
      <Modal
        transparent={true}
        visible={showTooltipModal && tooltip !== null}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => {
          setShowTooltipModal(false);
          setTooltip(null);
        }}
      >
        <TouchableOpacity 
          style={{ flex: 1 }} 
          activeOpacity={1} 
          onPress={() => {
            setShowTooltipModal(false);
            setTooltip(null);
          }}
        >
          <BlurView 
            intensity={50} 
            tint={Platform.OS === 'ios' ? 'systemMaterialDark' : 'dark'}
            style={{ flex: 1 }}
          >
            {/* Dark overlay for better focus */}
            <View style={{ 
              flex: 1, 
              backgroundColor: 'rgba(0,0,0,0.4)', 
              zIndex: 100,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: Platform.OS === 'ios' ? 20 : 24,
              paddingVertical: Platform.OS === 'ios' ? 40 : 24,
            }}>
              <TouchableOpacity 
                activeOpacity={1} 
                onPress={(e) => e.stopPropagation()}
                style={[styles.tooltipContent, {
                  width: Platform.OS === 'ios' ? '90%' : 'auto',
                  alignSelf: 'center',
                }]}
              >
                <Text style={styles.tooltipTitle}>
                  {tooltip?.month}
                </Text>
                
                {/* Income Row */}
                <View style={styles.tooltipRow}>
                  <View style={styles.tooltipLabelContainer}>
                    <View style={[styles.legendColor, { backgroundColor: '#22c55e' }]} />
                    <Text style={[styles.legendText, { fontSize: 16 }]}>Income:</Text>
                  </View>
                  <View style={styles.tooltipValueContainer}>
                    <Text style={[styles.tooltipAmount, { 
                      fontSize: 16, 
                      marginBottom: 0, 
                      color: '#22c55e' 
                    }]}>
                      {formatCurrency(tooltip?.income || 0)}
                    </Text>
                  </View>
                </View>

                {/* Expense Row */}
                <View style={styles.tooltipRow}>
                  <View style={styles.tooltipLabelContainer}>
                    <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
                    <Text style={[styles.legendText, { fontSize: 16 }]}>Expense:</Text>
                  </View>
                  <View style={styles.tooltipValueContainer}>
                    <Text style={[styles.tooltipAmount, { 
                      fontSize: 16, 
                      marginBottom: 0, 
                      color: '#ef4444' 
                    }]}>
                      {formatCurrency(tooltip?.expense || 0)}
                    </Text>
                  </View>
                </View>

                {/* Net Row */}
                <View style={[styles.tooltipRow, styles.tooltipDivider]}>
                  <View style={styles.tooltipLabelContainer}>
                    <View style={[styles.legendColor, { 
                      backgroundColor: '#3b82f6' 
                    }]} />
                    <Text style={[styles.legendText, { fontSize: 16, fontWeight: 'bold' }]}>Net:</Text>
                  </View>
                  <View style={styles.tooltipValueContainer}>
                    <Text style={[styles.tooltipAmount, { 
                      fontSize: 18, 
                      marginBottom: 0,
                      color: (tooltip?.income || 0) - (tooltip?.expense || 0) >= 0 ? '#22c55e' : '#ef4444'
                    }]}>
                      {formatCurrency((tooltip?.income || 0) - (tooltip?.expense || 0))}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.tooltipCloseButton}
                  onPress={() => {
                    setShowTooltipModal(false);
                    setTooltip(null);
                  }}
                >
                  <Text style={styles.tooltipCloseText}>Close</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          </BlurView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default BarChartComponent;