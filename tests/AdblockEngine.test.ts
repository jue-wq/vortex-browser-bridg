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
  it("treats parent and child subdomains as same-site for party modifiers",()=>{
    const thirdParty=new FilterEngine(["||tracker.example^$third-party"]);
    const firstParty=new FilterEngine(["||tracker.example^$~third-party"]);
    expect(thirdParty.shouldBlock({url:"https://tracker.example/pixel",initiator:"https://shop.tracker.example"})).toBe(false);
    expect(firstParty.shouldBlock({url:"https://tracker.example/pixel",initiator:"https://shop.tracker.example"})).toBe(true);
    expect(thirdParty.shouldBlock({url:"https://tracker.example/pixel",initiator:"https://publisher.test"})).toBe(true);
    expect(thirdParty.shouldBlock({url:"https://tracker.example/pixel",initiator:"https://shop.example"})).toBe(true);
    expect(thirdParty.shouldBlock({url:"https://tracker.example/pixel"})).toBe(false);
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
