package com.example.asnlookup.asn_lookup.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AsnDetails {
    private String asn;
    private Set<String> prefixes;

    public void setName(String holder)
    {
    }
}
