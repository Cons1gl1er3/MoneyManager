import React from 'react';
// import { PieChart } from 'react-native-chart-kit';
import { Text, View } from 'react-native';

interface PieChartProps {
  data: { name: string; population: number; color: string; legendFontColor: string; legendFontSize: number }[];
  width: number;
  height: number;
  accessor: string;
  absolute?: boolean;
  center?: number[];
  showLegend?: boolean;
  alignment?: string;
}

const PieChartComponent: React.FC<PieChartProps> = ({
  data,
  width,
  height,
  accessor,
  absolute = false,
  center = [0, 0],
  showLegend = true,
  alignment = "row",
}) => {
    return (
        <View className={`flex-${alignment} items-center`}>
        {/* Pie Chart */}
        {/* <PieChart
            data={data}
            width={width}
            height={height}
            chartConfig={{
            backgroundColor: 'transparent',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor={accessor}
            backgroundColor="transparent"
            paddingLeft="0"
            absolute={absolute}
            hasLegend={false}
            center={center}
        /> */}

        {/* Custom Legend */}
        {showLegend && (
            <View className="mt-4 space-y-2">
            {data.map((item, index) => (
                <View key={index} className="flex-row items-center">
                {/* Colored Circle */}
                <View
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                />
                {/* Category Name */}
                <Text className="ml-2 text-sm text-gray-700">{item.name}</Text>
                {/* Category Value */}
                <Text className="ml-auto text-sm font-semibold text-gray-900">
                    €{item.population.toFixed(1)}
                </Text>
                </View>
            ))}
            </View>
        )}
        </View>
    );
};

export default PieChartComponent;