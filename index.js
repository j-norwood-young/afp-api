const puppeteer = require("puppeteer");
require("dotenv").config();
const rest = require("restler-bluebird");

(async () => {
	const browser = await puppeteer.launch({ headless: true, timeout: 60000 });
	const page = await browser.newPage();
	console.log("Loading url", process.env.AFP_URL);

	// Load the site
	await page.goto(process.env.AFP_URL);

	console.log("Fetching existing articles");
	var storedArticleData = await rest.get(process.env.API_URL + "article", {
		fields: "provider_uid",
		username: process.env.API_USERNAME,
		password: process.env.API_PASSWORD
	});
	var storedArticles = storedArticleData.data;

	// Get rid of blocking page
	await page.waitForFunction(
		"document.getElementById('shortcutParent').style.display == 'block'"
	);
	await page.waitForFunction(
		"document.getElementById('shortcutParent').style.display = 'none'"
	);

	// Login
	await page.waitForSelector("#username");
	await page.type("#username", process.env.AFP_USERNAME);
	await page.type("#Password", process.env.AFP_PASSWORD);
	await page.click("#btnConnexion > input");

	await page.waitForSelector("#login");
	page.on("response", response => {
		(async () => {
			if (
				response.url ===
				"http://www.afpforum.com/AFPForum/AddDateCriterion/mobileapi.ashx"
			) {
				var jsonResponse = await response.json();
				var articles = jsonResponse.Data.Results;
				// console.log(articles);
				await page.waitFor(5000);
				for (let article of articles) {
					let exists = storedArticles.find(
						storedArticle =>
							storedArticle.provider_uid === article.UniqueName
					);
					if (!exists) {
						console.log("Found unique article", article.UniqueName);
						await page.click(
							`[data-uniquename='${article.UniqueName}']`
						);
						await page.waitFor(2000);
						await page.click("#docDetailBack");
						await page.waitFor(500);
					}
				}
				console.log("All done");
				await page.waitFor(2000);
				await browser.close();
			} else if (
				response.url ===
				"http://www.afpforum.com/AFPForum/DocumentGet/mobileapi.ashx"
			) {
				var jsonResponse = await response.json();
				// console.log(jsonResponse);
				var article = jsonResponse.Data;
				console.log(
					"Saving article",
					jsonResponse.ContextData,
					article.Title
				);
				var body = article.Description;
				var data = {
					headline: article.Title,
					blurb: "",
					provider_uid: jsonResponse.ContextData,
					body,
					byline: article.ByLine,
					provider: "AFP",
					date: new Date(),
					city: "",
					country: "",
					keywords: article.Keywords.split("|")
				};
				// console.log({ data });
				await rest.post(process.env.API_URL + "article", {
					data,
					username: process.env.API_USERNAME,
					password: process.env.API_PASSWORD
				});
				// console.log({ article });
			}
		})();
	});
	// Accept T&Cs
	await page.waitForSelector("#cbAcceptCGU");
	await page.click("#cbAcceptCGU");
	await page.click("#btnOKCGU");

	// // Get rid of overlay
	await page.click("body");

	// await page.waitFor(5000);

	// // Wait for the results page to load and display the results.
	// const resultsSelector = "li.li_news_text";
	// await page.waitForSelector(resultsSelector);

	// // Extract the results from the page.
	// const stories = await page.evaluate(resultsSelector => {
	// 	const s = Array.from(document.querySelectorAll(resultsSelector));
	// 	return s.map(story => {
	// 		return {
	// 			headline: story
	// 				.getElementsByClass("doc-title")[0]
	// 				.innerHTML.trim()
	// 		};
	// 	});
	// }, resultsSelector);
	// console.log(links);
	// console.log("All done");
	// await browser.close();
})();