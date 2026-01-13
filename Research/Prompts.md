## Creating types/entities/enums

```
#file:1 - Indexers Type.md file contants all the types, entity, enum needed to fully implement Indexers page and it's subpage's builder subpage. Add all the type, entity, enums that are needed. If the type, entity, enum needed is already there is any other folder for another feature then move it to common/generic folder that can be reused in other places. You can also do sub grouping inside #Indexer folder (inside config folder) if needed.

At the end, validate that all type/entity/enum needed are added and there is no duplicates in different folder

You can check #file:README.md for details about JSON schema. you can check #file:Skillset for exsiting implementation reference if needed.

Once complete do the same for #file:2 - Datasource Type.md #file:3 - Alias Type.md #file:4 - SynonymMap.md #file:5 - KnowledgeSource.md #file:6 - KnowledgeBase.md #file:7 - KnowledgeBaseRetrievalResponse.md 
```

## Code Review

```
Before committing the code do final check on all the #changes , and do code cleanup, removing any unused code code because of new changes, clean code and making sure #backend.instructions.md and #frontend.instructions.md instructions are followed. Build and validate both frontend and backend to makesure there is no build error or warnings
```