import {describe,expect,it} from "vitest";
import {FilterEngine} from "../src/adblock/FilterEngine";
describe("local adblock filter engine",()=>{
  it("blocks matching ad domains and subdomains",()=>{
    const engine=new FilterEngine(["||ads.example^"]);
    expect(engine.shouldBlock({url:"https://ads.example/banner.js",type:"script"})).toBe(true);
    expect(engine.shouldBlock({url:"https://cdn.ads.example/banner.png",type:"image"})).toBe(true);
  });
  it("honors exception rules",()=>{
    const engine=new FilterEngine(["||ads.example^","@@||ads.example^"]);
    expect(engine.shouldBlock({url:"https://ads.example/banner.js"})).toBe(false);
  });
  it("honors resource types and initiator domains",()=>{
    const engine=new FilterEngine(["||ads.example^$script,domain=publisher.example"]);
    expect(engine.shouldBlock({url:"https://ads.example/a.js",initiator:"https://publisher.example",type:"script"})).toBe(true);
    expect(engine.shouldBlock({url:"https://ads.example/a.png",initiator:"https://publisher.example",type:"image"})).toBe(false);
    expect(engine.shouldBlock({url:"https://ads.example/a.js",initiator:"https://other.example",type:"script"})).toBe(false);
  });
  it("returns cosmetic selectors for matching hosts and applies exceptions",()=>{
    const engine=new FilterEngine(["##.ad-slot","publisher.example##.sponsor","publisher.example#@#.sponsor"]);
    expect(engine.getCosmeticSelectors("publisher.example")).toEqual([".ad-slot"]);
    expect(engine.getCosmeticSelectors("elsewhere.example")).toEqual([".ad-slot"]);
  });
  it("compiles supported host rules to DNR rules",()=>{
    const engine=new FilterEngine(["||ads.example^","@@||safe.example^"]);
    expect(engine.toDnrRules()).toHaveLength(2);
    expect(engine.toDnrRules()[1]?.action.type).toBe("allow");
  });
});
