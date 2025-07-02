package com.example.asnlookup.asn_lookup.service;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
public class SpoofingDataScrapingService {

    private static final String START_URL = "https://spoofer.caida.org/recent_tests.php?as_include=&country_include=ind";
    private static final String BASE_URL = "https://spoofer.caida.org/";

    public List<String> scrapeSpoofingData() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new", "--no-sandbox", "--disable-gpu");

        WebDriver driver = new ChromeDriver(options);
        List<String> result = new ArrayList<>();

        try {
            String currentUrl = START_URL;
            boolean isFirstPage = true;

            while (currentUrl != null) {
                driver.get(currentUrl);

                WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
                wait.until(ExpectedConditions.presenceOfElementLocated(By.tagName("table")));

                List<WebElement> tables = driver.findElements(By.tagName("table"));

                if (tables.size() > 1) {
                    WebElement table = tables.get(1); // second table contains data
                    List<WebElement> rows = table.findElements(By.tagName("tr"));

                    for (WebElement row : rows) {
                        List<WebElement> headers = row.findElements(By.tagName("th"));
                        List<WebElement> cells = row.findElements(By.tagName("td"));

                        StringBuilder line = new StringBuilder();

                        if (!headers.isEmpty()) {
                            if (isFirstPage) {
                                for (WebElement cell : headers) {
                                    line.append(cell.getText().trim()).append("\t");
                                }
                                result.add(line.toString());
                            }
                            continue;
                        }

                        for (WebElement cell : cells) {
                            line.append(cell.getText().trim()).append("\t");
                        }
                        result.add(line.toString());
                    }
                }

                // Check for "Next 100 results"
                List<WebElement> nextLinks = driver.findElements(By.partialLinkText("Next 100"));
                if (!nextLinks.isEmpty()) {
                    String href = nextLinks.get(0).getAttribute("href");
                    if (!href.startsWith("http")) {
                        href = BASE_URL + href;
                    }
                    currentUrl = href;
                    Thread.sleep(1000); // gentle pause
                    isFirstPage = false;
                } else {
                    currentUrl = null;
                }
            }

            System.out.println("Scraping complete. Total lines: " + result.size());

        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            driver.quit();
        }

        return result;
    }
}
