package com.example.asnlookup.asn_lookup.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class IPLookupService {

    @Value("${output.directory}")
    private String outputDirectory;

    @Value("${ipwhois.api.url}")
    private String ipWhoisApiUrl;

    private final WebClient webClient = WebClient.create();

    /**
     * Fetches WHOIS data for a given IP address from an external API,
     * saves it to a file, and returns the JSON response as a string.
     *
     * @param ip The IP address to look up
     * @return JSON string of the WHOIS data
     * @throws IOException if writing to file fails
     */
    public String fetchAndSaveIPWhois(String ip) throws IOException {
        // Fetch data from external IP WHOIS API
        String jsonResponse = webClient.get()
                .uri(ipWhoisApiUrl + ip)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        // Ensure output directory exists
        Path directoryPath = Paths.get(outputDirectory);
        if (!Files.exists(directoryPath)) {
            Files.createDirectories(directoryPath);
        }

        // Write JSON response to file
        String fileName = outputDirectory + "/" + ip.replaceAll("\\.", "_") + "_details.json";
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(fileName))) {
            writer.write(jsonResponse);
        }

        // Return the actual JSON to caller (e.g., REST controller)
        return jsonResponse;
    }
}
