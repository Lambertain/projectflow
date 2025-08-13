'use client';

interface OverviewChartProps {
  data: Array<{ name: string; income: number; expense: number; }>;
}

export function OverviewChart({ data }: OverviewChartProps) {
  const maxValue = Math.max(...data.flatMap(item => [item.income, item.expense]));

  return (
    <div className="w-full h-[350px] p-4">
      <div className="flex items-end justify-between h-full space-x-4">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1 space-y-1">
            <div className="flex space-x-1 w-full h-full items-end">
              <div 
                className="w-1/2 bg-green-400 rounded-t transition-all duration-300 hover:opacity-80"
                style={{ 
                  height: `${(item.income / maxValue) * 100}%`,
                  minHeight: '4px'
                }}
                title={`Доход: $${item.income}`}
              />
              <div 
                className="w-1/2 bg-red-400 rounded-t transition-all duration-300 hover:opacity-80"
                style={{ 
                  height: `${(item.expense / maxValue) * 100}%`,
                  minHeight: '4px'
                }}
                title={`Расход: $${item.expense}`}
              />
            </div>
            <div className="text-xs text-muted-foreground text-center">
              {item.name}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center space-x-4 mt-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-400 rounded" />
          <span>Доход</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-400 rounded" />
          <span>Расход</span>
        </div>
      </div>
    </div>
  );
}
