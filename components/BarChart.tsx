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
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    }),
  },
  noDataContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    minHeight: 200,
  },
  noDataText: {
    color: '#6b7280',
    fontSize: 18,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    ...(Platform.OS === 'web' ? {
      gap: 32,
    } : {}),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    ...(Platform.OS !== 'web' ? {
      marginHorizontal: 16,
    } : {}),
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
  tooltipContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 320,
    maxWidth: Platform.OS === 'web' ? 400 : 320,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    }),
  },
  tooltipTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 24,
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
  const chartWidth = Math.min(screenWidth - 64 - yAxisWidth, 800); // Max width for web

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
                        ...(Platform.OS !== 'web' ? {
                          elevation: 1,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.1,
                          shadowRadius: 1,
                        } : {}),
                      }}
                    />
                    {/* Expense Bar */}
                    <View
                      style={{
                        width: barWidth,
                        height: Math.max(expenseHeight, minValue === 0 ? 0 : 2), // Show 0 height if value is 0
                        backgroundColor: '#ef4444', // Red
                        borderRadius: expenseHeight > 4 ? 2 : 0, // No radius for very small bars
                        ...(Platform.OS !== 'web' ? {
                          elevation: 1,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.1,
                          shadowRadius: 1,
                        } : {}),
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
        visible={showTooltipModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTooltipModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTooltipModal(false)}
        >
          {tooltip && (
            <View style={styles.tooltipContainer}>
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <Text style={styles.tooltipTitle}>
                   {tooltip.month}
                </Text>
              </View>
              
              <View style={Platform.OS === 'web' ? { gap: 16 } : {}}>
                <View style={[styles.tooltipRow, Platform.OS !== 'web' && { marginBottom: 16 }]}>
                  <View style={styles.tooltipLabelContainer}>
                    <View style={[styles.legendColor, { backgroundColor: '#22c55e', marginRight: 12 }]} />
                    <Text style={{ color: '#374151', fontWeight: '500', fontSize: 16 }}>Income:</Text>
                  </View>
                  <View style={styles.tooltipValueContainer}>
                    <Text style={{ color: '#22c55e', fontWeight: 'bold', fontSize: 18 }}>
                      {formatCurrency(tooltip.income)}
                    </Text>
                  </View>
                </View>
                
                <View style={[styles.tooltipRow, Platform.OS !== 'web' && { marginBottom: 16 }]}>
                  <View style={styles.tooltipLabelContainer}>
                    <View style={[styles.legendColor, { backgroundColor: '#ef4444', marginRight: 12 }]} />
                    <Text style={{ color: '#374151', fontWeight: '500', fontSize: 16 }}>Expense:</Text>
                  </View>
                  <View style={styles.tooltipValueContainer}>
                    <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 18 }}>
                      {formatCurrency(tooltip.expense)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.tooltipDivider}>
                  <View style={styles.tooltipRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#374151', fontWeight: '600', fontSize: 16 }}>Net:</Text>
                    </View>
                    <View style={styles.tooltipValueContainer}>
                      <Text 
                        style={{ 
                          fontWeight: 'bold', 
                          fontSize: 20,
                          color: tooltip.income >= tooltip.expense ? '#22c55e' : '#ef4444'
                        }}
                      >
                        {tooltip.income >= tooltip.expense ? '+' : ''}
                        {formatCurrency(tooltip.income - tooltip.expense)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowTooltipModal(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default BarChartComponent; 