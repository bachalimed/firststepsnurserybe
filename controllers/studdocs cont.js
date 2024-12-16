if (familyId && year && criteria === "OnlyPhotos") {
    //console.log(familyId, criteria);
    try {
      // Step 1: Retrieve family data
      const family = await Family.findById(familyId).lean(); // Fetch family by ID

      if (!family) {
        throw new Error("Family not found");
      }

      // Step 2: Fetch the student documents for the given year and document titles
      const titles = ["Father Photo", "Mother Photo", "Student Photo"]; // Define the titles you're interested in
      const studentDocumentsListt = await fetchStudentDocuments(year, titles); // Fetch documents

      console.log(
        studentDocumentsListt[0],
        "studentDocumentlistttttttttttttttttttttttt 00"
      );
      // Step 3: Loop over the children and attach relevant documents (Father, Mother, and Student Photo)
      const fatherPhoto = await StudentDocument.findOne({
        studentId: family.children[0].child, // Assuming you're looking for the first child in the family
        studentDocumentReference: {
          $in: studentDocumentsListt.flatMap(
            (item) =>
              // Access the `documentsList` array and filter for documents with `documentTitle === 'Father Photo'`
              item.documentsList
                .filter((document) => document.documentTitle === "Father Photo")
                .map((document) => document.documentReference) // Get the `documentReference` for those documents
          ),
        },
      }).lean();

      // console.log(fatherPhoto,'fatherPhoto')

      const motherPhoto = await StudentDocument.findOne({
        studentId: family.children[0].child, // Assuming you're looking for the first child in the family
        studentDocumentReference: {
          $in: studentDocumentsListt.flatMap(
            (item) =>
              // Access the `documentsList` array and filter for documents with `documentTitle === 'Father Photo'`
              item.documentsList
                .filter((document) => document.documentTitle === "Mother Photo")
                .map((document) => document.documentReference) // Get the `documentReference` for those documents
          ),
        },
      }).lean();

      // Attach father and mother photos to the family data
      if (fatherPhoto) {
        family.fatherPhotoId = fatherPhoto?._id; // Or any other way you want to append
      }

      if (motherPhoto) {
        family.motherPhotoId = motherPhoto?._id;
      }

      const studentPhotos = await Promise.all(
        family.children.map(async (child) => {
          // Find the relevant StudentDocument for the current child
          const studentPhoto = await StudentDocument.findOne({
            studentId: child.child, // Assuming `child.child` is the correct field for the student ID
            studentDocumentReference: {
              $in: studentDocumentsListt.flatMap(
                (item) =>
                  // Access the `documentsList` array and filter for documents with `documentTitle === 'Student Photo'`
                  item.documentsList
                    .filter(
                      (document) => document.documentTitle === "Student Photo"
                    )
                    .map((document) => document.documentReference) // Get the `documentReference` for those documents
              ),
            },
          }).lean();
console.log(studentPhoto,'studentPhotoinside')
          // Return the document if found
          return {
            childId: child.child,
            studentPhoto: studentPhoto || null, // If not found, set to null
          };
        })
      );

      console.log(studentPhotos);

    //   if (studentPhoto) {
    //     family.children[family.children.indexOf(child)].studentPhoto =
    //       studentPhoto;
    //   }

      // Step 4: Return the modified family data

      return res.json(family);
    } catch (error) {
      console.error("Error fetching family data with documents:", error);
      throw error;
    }
  } else {
    // Handle case where query parameters are missing

    return res
      .status(400)
      .json({ message: "Required data is missing" });
  }
});

const fetchStudentDocuments = async (year, titles) => {
    try {
      // Fetch the student documents that match the year
      const studentDocumentsListt = await StudentDocumentsList.find({
        documentsAcademicYear: year,
      }).lean();
  
      // Filter the documentsList array for each document to only include the specified titles
      const filteredDocuments = studentDocumentsListt.map((doc) => {
        // Filter the documentsList to include only the titles in the 'titles' array
        doc.documentsList = doc.documentsList.filter((document) =>
          titles.includes(document.documentTitle)
        );
  
        return doc;
      });
  
      //console.log(filteredDocuments, 'filteredDocuments'); // Log the filtered documents
      return filteredDocuments;
    } catch (error) {
      console.error("Error fetching student documents:", error);
      throw error;
    }
  };