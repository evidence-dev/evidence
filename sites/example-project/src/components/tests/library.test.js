import * as ssf from "ssf";
import { tidy, summarize, min, max, median } from "@tidyjs/tidy";
import gitRemoteOriginUrl from 'git-remote-origin-url'; // get the git repo

test("ssftest", () => {
    ssf.format("0.0", 1);
    expect(ssf.format("#,##0.0", 12345.67)).toBe("12,346.77");
});
  
test("tidyTest", () => {
    let data = [{ a: 1, b: 2 }, { a: 3, b: 4 }];
    let columnName = "a";
    let seriesExtents = tidy(
        data,
        summarize({ min: min(columnName), max: max(columnName), median: median(columnName) })
    )[0];
    expect(seriesExtents.min).toBe(1);
});

test("gitRemoteOriginUrl", async () => {
    let settings = {};
    settings.gitRepo = await gitRemoteOriginUrl();
    expect(settings.gitRepo).toBe("git@github.com:evidence-dev/evidence.git");
});



  