import type { Item } from './item';

interface TradeItem {
  item: Item;
  demand: number;
}

export class Station {
  id: number;
  name: string;
  items: TradeItem[] = [];

  constructor(name: string, id: number) {
    this.name = name;
    this.id = id;
  }

  public static fromJSONString(jsonString: string): Station {
    const data = JSON.parse(jsonString);
    const station = new Station(data.name, data.id);
    station.items = data.items;
    return station;
  }

  public getSupplyItems(): TradeItem[] {
    return this.items.filter((tradeItem) => tradeItem.demand < 0);
  }

  public getDemandItems(): TradeItem[] {
    return this.items.filter((tradeItem) => tradeItem.demand > 0);
  }

  public addItem(item: Item, demand: number): void {
    this.items.push({ item, demand });
  }

  public removeItem(itemId: number): void {
    this.items = this.items.filter((tradeItem) => tradeItem.item.id !== itemId);
  }

  public getItem(itemId: number): TradeItem | undefined {
    return this.items.find((tradeItem) => tradeItem.item.id === itemId);
  }

  public toString(): string {
    return this.name;
  }
}
