import { Component, OnInit } from '@angular/core';
import { Employee } from '../models/Employee';
import { EmployeeService } from '../services/employee.service';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';

Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrl: './employee.component.css'
})
export class EmployeeComponent implements OnInit{

  employees: Employee[] = [];
  isBrowser = false;
  ChartDataLabels = ChartDataLabels;


  pieChartData: ChartData<'pie', number[], string[]> = {
    labels: [],
    datasets: [{ data: [] }]
  };

  pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      datalabels: {
        formatter: (value: number, context) => {
          const datasetValues = context.chart.data.datasets[0].data as number[];
          const total = datasetValues.reduce((sum, val) => sum + val, 0);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
          return `${percentage}%`;
        },
        color: 'black',
        font: {
          weight: 'bold',
          size: 11
        }
      },
      legend: {
        position: 'bottom'
      }
    }
  };

  result: {name: string, total: number}[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private service: EmployeeService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.service.getEmployees().subscribe(data => {
      this.employees = data;

      const map = new Map<string, number>();

      this.employees.forEach(e => {
        if(e.DeletedOn != null || e.EmployeeName == '' || e.EmployeeName == null) return;
        if(e.StarTimeUtc > e.EndTimeUtc) return;

        const start = new Date(e.StarTimeUtc);
        const end = new Date(e.EndTimeUtc);
        let hours = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));

        const currentHours = map.get(e.EmployeeName) || 0;
        map.set(e.EmployeeName, currentHours + hours);
      });

      this.result = Array.from(map.entries()).map(([name, total]) => ({ name, total: total })).sort((a, b) => b.total - a.total);

      this.pieChartData = {
        labels: this.result.map(e => e.name) as unknown as string[][],
        datasets: [{ data: this.result.map(e => e.total) }]
      };
    });
  }

}
