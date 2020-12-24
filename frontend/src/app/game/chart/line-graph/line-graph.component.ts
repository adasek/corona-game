import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {ChartDataSets, ChartOptions} from 'chart.js';
import {BaseChartDirective, Label} from 'ng2-charts';

import 'chartjs-plugin-datalabels';
import 'chartjs-plugin-zoom';
import {EMPTY, Observable} from 'rxjs';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';

export type NodeState = 'ok' | 'warn' | 'critical' | undefined;

export interface LineNode {
  value: number;
  event?: string;
  state: NodeState;
}


@UntilDestroy()
@Component({
  selector: 'cvd-line-graph',
  templateUrl: './line-graph.component.html',
  styleUrls: ['./line-graph.component.scss']
})
export class LineGraphComponent implements OnInit {

  readonly colors = {
    ok: '869c66',
    warn: 'ff9502',
    critical: 'd43501'
  };

  readonly defaultDataset: ChartDataSets = {
    borderColor: `#${this.colors.ok}`,
    backgroundColor: `#${this.colors.ok}33`,
    pointRadius: 4,
    pointBackgroundColor: context => {
      return context.dataIndex && this.eventNodes[context.dataIndex] ? `#${this.colors.ok}` : `#${this.colors.ok}33`;
    },
    pointBorderColor: `#${this.colors.ok}`,
    pointBorderWidth: context => context.dataIndex && this.eventNodes[context.dataIndex] ? 3 : 1,
    pointHitRadius: 5
  };

  @Input()
  reset$: Observable<void> = EMPTY;

  @Input() title = '';

  @Input()
  set tick(tick: LineNode | null) {
    if (!tick) return;

    if (tick.state !== this.currentState) {
      this.currentState = tick.state;
      this.currentDatasetIndex++;

      this.datasets = [...this.datasets, {
        ...this.defaultDataset,
        borderColor: `#${this.colors[tick.state!]}`,
        backgroundColor: `#${this.colors[tick.state!]}33`,
        data: [...this.allData, this.lastValue, tick.value]
      }];
    } else {
      this.datasets[this.currentDatasetIndex].data!.push(tick.value);
    }

    if (!this.isInitValue) this.allData.push(NaN);

    this.lastValue = tick.value;
    const lastDate = this.currentDate;
    lastDate.setDate(lastDate.getDate() + 1);

    this.currentDate = lastDate;
    this.labels.push(lastDate.toLocaleDateString());
    this.eventNodes.push(tick.event);
    this.isInitValue = false;
  }

  @ViewChild(BaseChartDirective, {static: false}) chart!: BaseChartDirective;

  private allData: number[] = [];
  private isInitValue = true;
  private currentState: NodeState = 'ok';
  private currentDatasetIndex = 0;
  private currentDate = new Date();
  private lastValue = 0;
  private eventNodes: (string | undefined)[] = [];
  private font = {
    family: '"worksans", "Helvetica Neue", arial',
    size: 11,
    weight: 600,
  };

  datasets: ChartDataSets[] = [{...this.defaultDataset, data: []}];
  labels: Label[] = [new Date().toLocaleDateString()];
  options: ChartOptions = {
    title: {
      display: false,
      text: undefined,
    },
    legend: {
      display: false,
    },
    animation: {
      duration: 300,

    },
    responsive: true,
    tooltips: {
      enabled: true,
      displayColors: false,
      callbacks: {
        label: tooltipItem => `Počet nakažených: ${tooltipItem?.value?.toString()}`,
        title: tooltipItem => (tooltipItem[0].index && this.eventNodes[tooltipItem[0].index]) || '',
      },
    },
    plugins: {
      datalabels: {
        anchor: 'center',
        clamp: true,
        align: 'end',
        offset: 5,
        textAlign: 'center',
        backgroundColor: 'white',
        borderColor: 'blue',
        borderRadius: 3,
        display: context => Boolean(this.eventNodes[context.dataIndex]),
        formatter: (_, context) => this.eventNodes[context.dataIndex],
        font: this.font,
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
          speed: 2,
        },
        zoom: {
          enabled: true,
          speed: 1,
          mode: 'x',
        }
      }
    },
  };

  ngOnInit() {
    this.options.title = {
      text: this.title,
      display: Boolean(this.title),
    };

    this.reset$.pipe(
      untilDestroyed(this)
    ).subscribe(() => this.reset());
  }

  reset() {
    this.datasets = [{...this.defaultDataset, data: []}];
    this.labels = [new Date().toLocaleDateString()];
    this.eventNodes = [];
    this.currentState = 'ok';
    this.currentDatasetIndex = 0;
    this.currentDate = new Date();
    this.lastValue = 0;
    this.allData = [];
    this.isInitValue = true;
  }

  resetZoom() {
    (this.chart.chart as any).resetZoom();
  }
}
