// single file

// one,multi
// txt, wiki
// space (num), tab
// na,-, *, +,mix
// na,id,loc

// na - "not available (n/a)"
// n - "and"
// w - "with"

export const cntntOneTxtSpace2NaNa: string = 
`root
  node
    id
    data
      filename
      uri
      title
    rels
      famrel
      refs
        attrs
        links
  graph
    tree
    web
  markdown
    wikilinks
  semantic-tree
    st
`;

export const cntntOneTxtSpace2NaNawMisalignedSpacing: string = 
`root
  graph
   tree
 web
`;

export const cntntOneWikiSpace2DashID: string = 
`- [[root-(0a1b2)]]
  - [[node-(0a1b2)]]
    - [[id-(0a1b2)]]
    - [[data-(0a1b2)]]
      - [[filename-(0a1b2)]]
      - [[uri-(0a1b2)]]
      - [[title-(0a1b2)]]
    - [[rels-(0a1b2)]]
      - [[famrel-(0a1b2)]]
      - [[refs-(0a1b2)]]
        - [[attrs-(0a1b2)]]
        - [[links-(0a1b2)]]
  - [[graph-(0a1b2)]]
    - [[tree-(0a1b2)]]
    - [[web-(0a1b2)]]
  - [[markdown-(0a1b2)]]
    - [[wikilinks-(0a1b2)]]
  - [[semantic-tree-(0a1b2)]]
    - [[st-(0a1b2)]]
`;

export const cntntOneWikiSpace2MixNa: string = 
`- [[root]]
  * [[node]]
    + [[id]]
    + [[data]]
      - [[filename]]
      - [[uri]]
      - [[title]]
    + [[rels]]
      - [[famrel]]
      - [[refs]]
        - [[attrs]]
        - [[links]]
  * [[graph]]
    + [[tree]]
    + [[web]]
  * [[markdown]]
    + [[wikilinks]]
  * [[semantic-tree]]
    + [[st]]
`;


export const cntntOneWikiSpace2DashIDwLeadingWS: string = 
`

- [[root-(0a1b2)]]
  - [[node-(0a1b2)]]
    - [[id-(0a1b2)]]
    - [[data-(0a1b2)]]
      - [[filename-(0a1b2)]]
      - [[uri-(0a1b2)]]
      - [[title-(0a1b2)]]
    - [[rels-(0a1b2)]]
      - [[famrel-(0a1b2)]]
      - [[refs-(0a1b2)]]
        - [[attrs-(0a1b2)]]
        - [[links-(0a1b2)]]
  - [[graph-(0a1b2)]]
    - [[tree-(0a1b2)]]
    - [[web-(0a1b2)]]
  - [[markdown-(0a1b2)]]
    - [[wikilinks-(0a1b2)]]
  - [[semantic-tree-(0a1b2)]]
    - [[st-(0a1b2)]]
`;

// 'root-(0a1b2)' is duplicated in the first and last entry
export const cntntOneWikiSpace2DashIDwDuplicates = 
`- [[root-(0a1b2)]]
  - [[node-(0a1b2)]]
    - [[id-(0a1b2)]]
    - [[data-(0a1b2)]]
      - [[filename-(0a1b2)]]
      - [[uri-(0a1b2)]]
      - [[title-(0a1b2)]]
    - [[rels-(0a1b2)]]
      - [[famrel-(0a1b2)]]
      - [[refs-(0a1b2)]]
        - [[attrs-(0a1b2)]]
        - [[links-(0a1b2)]]
  - [[graph-(0a1b2)]]
    - [[tree-(0a1b2)]]
    - [[web-(0a1b2)]]
  - [[markdown-(0a1b2)]]
    - [[wikilinks-(0a1b2)]]
  - [[semantic-tree-(0a1b2)]]
    - [[root-(0a1b2)]]
`;

export const cntntOneTxtSpace2NaID: string = 
`root-(0a1b2)
  node-(0a1b2)
    id-(0a1b2)
    data-(0a1b2)
      filename-(0a1b2)
      uri-(0a1b2)
      title-(0a1b2)
    rels-(0a1b2)
      famrel-(0a1b2)
      refs-(0a1b2)
        attrs-(0a1b2)
        links-(0a1b2)
  graph-(0a1b2)
    tree-(0a1b2)
    web-(0a1b2)
  markdown-(0a1b2)
    wikilinks-(0a1b2)
  semantic-tree-(0a1b2)
    st-(0a1b2)
`;

export const cntntOneTxtSpace3NaID: string = 
`root-(0a1b2)
   node-(0a1b2)
      id-(0a1b2)
      data-(0a1b2)
         filename-(0a1b2)
         uri-(0a1b2)
         title-(0a1b2)
      rels-(0a1b2)
         famrel-(0a1b2)
         refs-(0a1b2)
            attrs-(0a1b2)
            links-(0a1b2)
   graph-(0a1b2)
      tree-(0a1b2)
      web-(0a1b2)
   markdown-(0a1b2)
      wikilinks-(0a1b2)
   semantic-tree-(0a1b2)
      st-(0a1b2)
`;

export const cntntOneTxtTabNaID: string = 
`root-(0a1b2)
\tnode-(0a1b2)
\t\tid-(0a1b2)
\t\tdata-(0a1b2)
\t\t\tfilename-(0a1b2)
\t\t\turi-(0a1b2)
\t\t\ttitle-(0a1b2)
\t\trels-(0a1b2)
\t\t\tfamrel-(0a1b2)
\t\t\trefs-(0a1b2)
\t\t\t\tattrs-(0a1b2)
\t\t\t\tlinks-(0a1b2)
\tgraph-(0a1b2)
\t\ttree-(0a1b2)
\t\tweb-(0a1b2)
\tmarkdown-(0a1b2)
\t\twikilinks-(0a1b2)
\tsemantic-tree-(0a1b2)
\t\tst-(0a1b2)
`;

export const cntntOneTxtSpace2NaLoc: string = 
`root-01-1
  node-02-2
    id-03-3
    data-04-3
      filename-05-4
      uri-06-4
      title-07-4
    rels-08-3
      famrel-09-4
      refs-10-4
        attrs-11-5
        links-12-5
  graph-13-2
    tree-14-3
    web-15-3
  markdown-16-2
    wikilinks-17-3
  semantic-tree-18-2
    st-19-3
`;

// multi file

export const cntntMultiWikiSpace2DashIDnNone: any = {
  'root':
`- [[root-(0a1b2)]]
  - [[node]]
  - [[graph]]
  - [[markdown-(0a1b2)]]
    - [[wikilinks-(0a1b2)]]
  - [[semantic-tree-(0a1b2)]]
    - [[st-(0a1b2)]]
`,
  'node':
`- [[node-(0a1b2)]]
  - [[id-(0a1b2)]]
  - [[data-(0a1b2)]]
    - [[filename-(0a1b2)]]
    - [[uri-(0a1b2)]]
    - [[title-(0a1b2)]]
  - [[rels-(0a1b2)]]
    - [[famrel-(0a1b2)]]
    - [[refs-(0a1b2)]]
      - [[attrs-(0a1b2)]]
      - [[links-(0a1b2)]]
`,
  'graph':
`- [[graph-(0a1b2)]]
  - [[tree-(0a1b2)]]
  - [[web-(0a1b2)]]
`
};

export const cntntMultiWikiSpace2DashNawIndexnEntrySiblings: any = {
  'i.bonsai':
`- [[root]]
  - [[semantic-tree]]
    - [[i.social-science]]
`,
  'i.social-science':
`- [[social-science]]
  - [[discourse]]
  - [[i.education]]
`,
  'i.education':
`- [[learning-theory]]
  - [[conditioning]]
    - [[classical-conditioning]]
`
};

export const cntntMultiTxtSpace2NaNawImproperIndent: Record<string, string> = {
  'i.bonsai':
`root
  graph
   tree
 web
`,
};

export const cntntMultiTxtSpace2NaNawOverIndent: Record<string, string> = {
  'i.bonsai':
`root
  graph
      tree
    web
`,
};

export const cntntMultiWikiSpace2DashNa: any = {
  'root':
`- [[root]]
`,
};
